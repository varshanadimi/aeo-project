# AEO Diagnostic

> See how your brand ranks across ChatGPT, Claude, and Gemini. Get a competitive report card and actionable insights.

![AEO Diagnostic](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Real AI queries** — hits GPT-4o, Claude, and Gemini in parallel
- **Smart scoring** — position, frequency, and sentiment analysis
- **Report card** — A+ to F grade with per-engine visibility bars
- **Insights engine** — actionable recommendations to improve your AEO ranking
- **Graceful fallback** — simulates GPT/Gemini via Claude if API keys are absent

## Quick start

```bash
git clone <repo>
cd aeo-diagnostic
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Keys

| Key | Required | Notes |
|-----|----------|-------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Powers Claude + fallback simulations |
| `OPENAI_API_KEY` | Optional | Real GPT-4o responses |
| `GEMINI_API_KEY` | Optional | Real Gemini 1.5 Pro responses |

Get keys at: [console.anthropic.com](https://console.anthropic.com) · [platform.openai.com](https://platform.openai.com) · [aistudio.google.com](https://aistudio.google.com)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## How scoring works

Each AI response is scored 0–100 based on:

| Factor | Points |
|--------|--------|
| Brand mentioned | +35 |
| Leads response (top 15%) | +30 |
| Early mention (top 30%) | +20 |
| Mentioned 3+ times | +15 |
| Positive framing | +15 |
| Response depth | +5 |
| Negative framing | -10 |

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Anthropic SDK** · **OpenAI SDK** · **Google Generative AI**
