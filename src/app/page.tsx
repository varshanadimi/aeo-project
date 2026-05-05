'use client'

import { useState } from 'react'
import type { DiagnosticReport } from '@/lib/scoring'
import ResultsPanel from '@/components/ResultsPanel'

const EXAMPLES = [
  { query: 'best magnesium supplement for seniors', brand: 'MagnaVitality' },
  { query: 'top CRM software for small business', brand: 'HubSpot' },
  { query: 'best protein powder for muscle gain', brand: 'Optimum Nutrition' },
  { query: 'best project management tool for remote teams', brand: 'Basecamp' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const steps = [
    'Querying ChatGPT…',
    'Querying Claude…',
    'Querying Gemini…',
    'Building report card…',
  ]

  async function runAnalysis() {
    if (!query.trim() || !brand.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    setLoadingStep(0)

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, steps.length - 1))
    }, 2000)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), brand: brand.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setReport(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  function setExample(ex: typeof EXAMPLES[0]) {
    setQuery(ex.query)
    setBrand(ex.brand)
    setReport(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-bg-app">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-brand uppercase tracking-widest">AEO Diagnostic</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-3">
            How does AI rank<br />
            <span className="text-brand">your product?</span>
          </h1>
          <p className="text-[#888] text-sm leading-relaxed max-w-md">
            Query GPT-4o, Claude, and Gemini simultaneously. Get a competitive
            report card showing where you rank — and how to climb.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder='Your brand name (e.g. "MagnaVitality")'
            className="w-full bg-surface border border-border rounded-xl px-5 h-12 text-sm text-white placeholder-[#555] focus:border-brand transition-colors"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && runAnalysis()}
              placeholder='Query to test (e.g. "best magnesium supplement for seniors")'
              className="flex-1 bg-surface border border-border rounded-xl px-5 h-12 text-sm text-white placeholder-[#555] focus:border-brand transition-colors"
            />
            <button
              onClick={runAnalysis}
              disabled={loading || !query.trim() || !brand.trim()}
              className="bg-brand hover:bg-brand-dark disabled:bg-brand-dim disabled:cursor-not-allowed text-white font-semibold text-sm px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? 'Running…' : 'Analyze →'}
            </button>
          </div>
        </div>

        {/* Examples */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <span className="text-xs text-[#555]">Try:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.query}
              onClick={() => setExample(ex)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-[#888] hover:border-brand hover:text-brand transition-colors"
            >
              {ex.query.replace('best ', '').replace('top ', '').split(' ').slice(0, 3).join(' ')}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <div className="flex justify-center gap-1.5 mb-5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <div className="text-sm text-[#888] mb-3">{steps[loadingStep]}</div>
            <div className="flex justify-center gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= loadingStep ? 'bg-brand w-6' : 'bg-border w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/40 rounded-2xl p-5 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {report && !loading && <ResultsPanel report={report} />}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-[#333]">
          Built with OpenAI GPT-4o · Anthropic Claude · Google Gemini
        </div>
      </div>
    </main>
  )
}
