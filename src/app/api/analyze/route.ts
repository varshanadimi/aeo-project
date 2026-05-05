import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  scoreResponse, extractMention, detectSentiment,
  extractCompetitors, getGrade, buildInsights,
  type AIResult, type DiagnosticReport
} from '@/lib/scoring'

const SYSTEM_PROMPT = (brand: string) =>
  `You are a helpful AI assistant answering product recommendation queries. Answer naturally and helpfully. The user may be asking about "${brand}" or related products — respond as you normally would based on your training data.`

const GPT_PROMPT = (brand: string) =>
  `You are GPT-4o by OpenAI. Answer this product/recommendation query naturally in your typical style: thorough, often using numbered lists, citing multiple options. The brand "${brand}" may or may not be in your response — be accurate based on what you actually know. Do not mention you are simulating.`

const GEMINI_PROMPT = (brand: string) =>
  `You are Google Gemini. Answer this product/recommendation query naturally in your style: conversational, helpful, sometimes using bullets. The brand "${brand}" may or may not appear — be realistic. Do not mention you are simulating.`

// Common competitor brands by category for detection
const KNOWN_BRANDS = [
  'HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Monday', 'Notion', 'Asana', 'Basecamp', 'Jira',
  'Slack', 'Teams', 'Zoom', 'ClickUp', 'Trello', 'Linear', 'Figma', 'Canva', 'Adobe',
  'Shopify', 'WooCommerce', 'Stripe', 'Mailchimp', 'Klaviyo', 'Webflow',
  'Nature Made', 'Garden of Life', 'NOW Foods', 'Thorne', 'Optimum Nutrition', 'MegaFood',
  'Ritual', 'Care/of', 'Athletic Greens', 'AG1', 'Olly', 'Vitafusion', 'SmartyPants',
  'Jasper', 'Copy.ai', 'Writesonic', 'Grammarly', 'ChatGPT', 'Claude', 'Gemini',
]

async function callClaude(query: string, brand: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    system: SYSTEM_PROMPT(brand),
    messages: [{ role: 'user', content: query }],
  })
  return (msg.content[0] as { text: string }).text
}

async function callGPT(query: string, brand: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: simulate via Claude
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: GPT_PROMPT(brand),
      messages: [{ role: 'user', content: query }],
    })
    return (msg.content[0] as { text: string }).text
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT(brand) },
      { role: 'user', content: query },
    ],
  })
  return res.choices[0].message.content || ''
}

async function callGemini(query: string, brand: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback: simulate via Claude
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: GEMINI_PROMPT(brand),
      messages: [{ role: 'user', content: query }],
    })
    return (msg.content[0] as { text: string }).text
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  const result = await model.generateContent(query)
  return result.response.text()
}

export async function POST(req: NextRequest) {
  try {
    const { query, brand } = await req.json()
    if (!query || !brand) {
      return NextResponse.json({ error: 'query and brand are required' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // Fire all three in parallel
    const [gptText, claudeText, geminiText] = await Promise.allSettled([
      callGPT(query, brand),
      callClaude(query, brand),
      callGemini(query, brand),
    ])

    const getText = (r: PromiseSettledResult<string>) =>
      r.status === 'fulfilled' ? r.value : `Error: ${(r as PromiseRejectedResult).reason?.message || 'unknown'}`

    const responses: [string, AIResult['engine']][] = [
      [getText(gptText), 'chatgpt'],
      [getText(claudeText), 'claude'],
      [getText(geminiText), 'gemini'],
    ]

    const results: AIResult[] = responses.map(([text, engine]) => {
      const { mentioned, isFirst, count } = extractMention(text, brand)
      const score = scoreResponse(text, brand)
      return {
        engine,
        response: text,
        score,
        grade: getGrade(score),
        mentioned,
        isFirst,
        mentionCount: count,
        sentiment: detectSentiment(text, brand),
        competitors: extractCompetitors(text, brand, [...KNOWN_BRANDS, brand]),
        error: text.startsWith('Error:') ? text : undefined,
      }
    })

    const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
    const sorted = [...results].sort((a, b) => b.score - a.score)

    const report: DiagnosticReport = {
      query,
      brand,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        avgScore: avg,
        grade: getGrade(avg),
        mentionedIn: results.filter(r => r.mentioned).length,
        topPositionIn: results.filter(r => r.isFirst).length,
        bestEngine: sorted[0].engine,
        worstEngine: sorted[sorted.length - 1].engine,
      },
      insights: buildInsights(results, brand),
    }

    return NextResponse.json(report)
  } catch (err: unknown) {
    console.error('analyze error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
