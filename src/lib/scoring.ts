export interface AIResult {
  engine: 'chatgpt' | 'claude' | 'gemini'
  response: string
  score: number
  grade: string
  mentioned: boolean
  isFirst: boolean
  mentionCount: number
  sentiment: 'positive' | 'neutral' | 'negative' | 'none'
  competitors: string[]
  error?: string
}

export interface DiagnosticReport {
  query: string
  brand: string
  timestamp: string
  results: AIResult[]
  summary: {
    avgScore: number
    grade: string
    mentionedIn: number
    topPositionIn: number
    bestEngine: string
    worstEngine: string
  }
  insights: Insight[]
}

export interface Insight {
  type: 'positive' | 'warning' | 'info' | 'action'
  text: string
}

export function scoreResponse(text: string, brand: string): number {
  const lo = text.toLowerCase()
  const bl = brand.toLowerCase()
  const mentioned = lo.includes(bl)
  if (!mentioned) return 0

  let score = 35

  // Position bonus
  const idx = lo.indexOf(bl)
  const words = lo.split(/\s+/).length
  const wpos = lo.substring(0, idx).split(/\s+/).length
  const relPos = wpos / words
  if (relPos < 0.15) score += 30
  else if (relPos < 0.30) score += 20
  else if (relPos < 0.50) score += 10

  // Frequency bonus
  const count = (lo.match(new RegExp(bl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (count >= 3) score += 15
  else if (count >= 2) score += 8

  // Context quality
  const sentences = text.split(/[.!?]+/)
  const brandSentences = sentences.filter(s => s.toLowerCase().includes(bl))
  const hasPositive = brandSentences.some(s =>
    /recommend|best|top|great|excellent|popular|trusted|leading|effective|quality/i.test(s)
  )
  const hasNegative = brandSentences.some(s =>
    /avoid|bad|poor|worst|not recommend|issue|problem/i.test(s)
  )
  if (hasPositive) score += 15
  if (hasNegative) score -= 10

  // Length / depth bonus
  if (text.length > 400) score += 5

  return Math.max(0, Math.min(100, score))
}

export function extractMention(text: string, brand: string) {
  const lo = text.toLowerCase()
  const bl = brand.toLowerCase()
  const mentioned = lo.includes(bl)
  const idx = lo.indexOf(bl)
  const words = lo.split(/\s+/).length
  const wpos = lo.substring(0, idx < 0 ? 0 : idx).split(/\s+/).length
  const isFirst = mentioned && wpos / words < 0.28
  const count = mentioned
    ? (lo.match(new RegExp(bl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    : 0
  return { mentioned, isFirst, count }
}

export function detectSentiment(text: string, brand: string): AIResult['sentiment'] {
  const lo = text.toLowerCase()
  const bl = brand.toLowerCase()
  if (!lo.includes(bl)) return 'none'
  const sentences = text.split(/[.!?]+/).filter(s => s.toLowerCase().includes(bl))
  const pos = sentences.filter(s =>
    /recommend|best|top|great|excellent|popular|trusted|leading|effective|quality|favorite|ideal/i.test(s)
  ).length
  const neg = sentences.filter(s =>
    /avoid|bad|poor|worst|not recommend|issue|problem|downside|weakness/i.test(s)
  ).length
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

export function extractCompetitors(text: string, brand: string, knownBrands: string[] = []): string[] {
  const competitors: string[] = []
  for (const b of knownBrands) {
    if (b.toLowerCase() !== brand.toLowerCase() && text.toLowerCase().includes(b.toLowerCase())) {
      competitors.push(b)
    }
  }
  return Array.from(new Set(competitors)).slice(0, 5)
}

export function getGrade(score: number): string {
  if (score >= 85) return 'A+'
  if (score >= 78) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 62) return 'B'
  if (score >= 55) return 'C+'
  if (score >= 47) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export function buildInsights(results: AIResult[], brand: string): Insight[] {
  const insights: Insight[] = []
  const mc = results.filter(r => r.mentioned).length
  const fc = results.filter(r => r.isFirst).length
  const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
  const positiveCount = results.filter(r => r.sentiment === 'positive').length
  const negativeCount = results.filter(r => r.sentiment === 'negative').length

  if (mc === 0) {
    insights.push({ type: 'warning', text: `"${brand}" wasn't mentioned in any AI response. You have zero AEO presence for this query. Prioritize getting featured in authoritative listicles and comparison articles that AI models learn from.` })
  } else if (mc === results.length) {
    insights.push({ type: 'positive', text: `"${brand}" appears in all ${results.length} AI responses — strong baseline coverage. Focus on securing top-of-response positioning.` })
  } else {
    const missing = results.filter(r => !r.mentioned).map(r => r.engine)
    insights.push({ type: 'info', text: `"${brand}" is visible in ${mc}/${results.length} engines. Missing from: ${missing.join(', ')}. Each engine has different training data — optimize for those specific sources.` })
  }

  if (fc >= 2) {
    insights.push({ type: 'positive', text: `Leading mention in ${fc}/${results.length} responses — a strong authority signal. AI models tend to list the most authoritative brand first.` })
  } else if (fc === 0 && mc > 0) {
    insights.push({ type: 'action', text: `"${brand}" is mentioned but never leads the response. To earn first position, focus on building more backlinks and citations from high-authority review sites.` })
  }

  if (positiveCount > 0) {
    insights.push({ type: 'positive', text: `Positive framing detected in ${positiveCount} response(s). AI models are recommending "${brand}" — a sign of good brand authority.` })
  }
  if (negativeCount > 0) {
    insights.push({ type: 'warning', text: `Negative framing detected in ${negativeCount} response(s). Address any known weaknesses that might appear in online reviews AI trains on.` })
  }

  if (avg < 40) {
    insights.push({ type: 'action', text: `Low overall AEO score (${avg}/100). Quick wins: get featured in "best of" articles for this query, earn mentions in Wikipedia or similar high-authority sources, and ensure your brand appears in FAQs and structured data.` })
  }

  const allCompetitors = results.flatMap(r => r.competitors)
  const compCounts: Record<string, number> = {}
  allCompetitors.forEach(c => { compCounts[c] = (compCounts[c] || 0) + 1 })
  const topComp = Object.entries(compCounts).sort((a, b) => b[1] - a[1])[0]
  if (topComp) {
    insights.push({ type: 'info', text: `"${topComp[0]}" appears alongside your brand most frequently (${topComp[1]}/${results.length} responses). Study how they earn mentions and what content positions them.` })
  }

  return insights
}
