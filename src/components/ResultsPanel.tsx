'use client'

import type { DiagnosticReport, AIResult } from '@/lib/scoring'

const ENGINE_META = {
  chatgpt: { label: 'ChatGPT', color: '#10a37f', dot: 'bg-[#10a37f]' },
  claude:  { label: 'Claude',  color: '#D97757', dot: 'bg-[#D97757]' },
  gemini:  { label: 'Gemini',  color: '#4285F4', dot: 'bg-[#4285F4]' },
}

const INSIGHT_STYLES = {
  positive: { bg: 'bg-green-950/30', border: 'border-green-800/30', icon: '✓', iconColor: 'text-green-400' },
  warning:  { bg: 'bg-amber-950/30', border: 'border-amber-800/30', icon: '⚠', iconColor: 'text-amber-400' },
  info:     { bg: 'bg-blue-950/30',  border: 'border-blue-800/30',  icon: '→', iconColor: 'text-blue-400' },
  action:   { bg: 'bg-purple-950/30', border: 'border-purple-800/30', icon: '↑', iconColor: 'text-purple-400' },
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
  return <span className={`text-3xl font-bold ${color}`}>{score}</span>
}

function MentionTag({ result }: { result: AIResult }) {
  const label = ENGINE_META[result.engine].label
  if (!result.mentioned) return (
    <span className="text-xs px-3 py-1 rounded-full bg-red-950/50 border border-red-800/30 text-red-400">
      {label}: not mentioned
    </span>
  )
  if (result.isFirst) return (
    <span className="text-xs px-3 py-1 rounded-full bg-purple-950/50 border border-purple-800/30 text-purple-300">
      {label}: leads response
    </span>
  )
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-green-950/50 border border-green-800/30 text-green-400">
      {label}: mentioned
    </span>
  )
}

function SentimentPill({ sentiment }: { sentiment: AIResult['sentiment'] }) {
  const map = {
    positive: 'bg-green-950/50 text-green-400 border-green-800/30',
    negative: 'bg-red-950/50 text-red-400 border-red-800/30',
    neutral:  'bg-[#1e1e28] text-[#888] border-border',
    none:     'bg-[#1e1e28] text-[#555] border-border',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${map[sentiment]}`}>
      {sentiment}
    </span>
  )
}

export default function ResultsPanel({ report }: { report: DiagnosticReport }) {
  const sorted = [...report.results].sort((a, b) => b.score - a.score)
  const maxScore = sorted[0]?.score || 1

  return (
    <div className="space-y-4 mt-2">
      {/* Summary cards */}
      <div className="border-t border-border pt-6 mb-2">
        <div className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">
          Report card — &quot;{report.brand}&quot;
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'AEO score', value: report.summary.avgScore, sub: '/ 100', colored: true },
            { label: 'Grade', value: report.summary.grade, sub: 'A+ – F', colored: true },
            { label: 'Mentioned in', value: `${report.summary.mentionedIn}/3`, sub: 'engines', colored: false },
            { label: 'Leads response', value: `${report.summary.topPositionIn}/3`, sub: 'engines', colored: false },
          ].map(card => (
            <div key={card.label} className="bg-surface-deep rounded-xl p-4 text-center">
              <div className="text-[11px] text-[#555] mb-2">{card.label}</div>
              {card.colored
                ? <ScoreBadge score={typeof card.value === 'number' ? card.value : 0} />
                : <div className="text-2xl font-bold text-white">{card.value}</div>
              }
              <div className="text-[11px] text-[#555] mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Visibility bars */}
        <div className="bg-[#18181f] border border-border rounded-2xl p-5 mb-4">
          <div className="text-[11px] font-semibold text-[#555] uppercase tracking-widest mb-4">
            Visibility by engine
          </div>
          <div className="space-y-3 mb-5">
            {sorted.map((r, i) => {
              const meta = ENGINE_META[r.engine]
              return (
                <div key={r.engine} className="flex items-center gap-3">
                  <div className="text-xs text-[#888] w-20 shrink-0 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </div>
                  <div className="flex-1 h-1.5 bg-[#111116] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(r.score / 100) * 100}%`, background: meta.color }}
                    />
                  </div>
                  <div className="text-xs text-[#666] w-7 text-right">{r.score}</div>
                  <div className="text-[11px] font-semibold w-6 text-center"
                    style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }}>
                    #{i + 1}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mention tags */}
          <div className="flex flex-wrap gap-2">
            {report.results.map(r => <MentionTag key={r.engine} result={r} />)}
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-semibold text-[#555] uppercase tracking-widest mb-3">
            Insights & actions
          </div>
          {report.insights.map((ins, i) => {
            const s = INSIGHT_STYLES[ins.type]
            return (
              <div key={i} className={`flex gap-3 p-4 rounded-xl border ${s.bg} ${s.border}`}>
                <span className={`${s.iconColor} shrink-0 text-sm font-bold mt-0.5`}>{s.icon}</span>
                <p className="text-sm text-[#ccc] leading-relaxed">{ins.text}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Responses */}
      <div>
        <div className="text-[11px] font-semibold text-[#555] uppercase tracking-widest mb-3">
          Raw AI responses
        </div>
        <div className="grid grid-cols-3 gap-3">
          {report.results.map(r => {
            const meta = ENGINE_META[r.engine]
            return (
              <div key={r.engine} className="bg-[#18181f] border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-medium text-[#aaa]">{meta.label}</span>
                  <SentimentPill sentiment={r.sentiment} />
                </div>
                <p className="text-xs text-[#bbb] leading-relaxed line-clamp-6">
                  {r.error ? (
                    <span className="text-red-400">{r.response}</span>
                  ) : r.response}
                </p>
                {r.competitors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10px] text-[#555] mb-1.5">Also mentioned</div>
                    <div className="flex flex-wrap gap-1">
                      {r.competitors.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#111116] text-[#666] border border-border">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-[#333] text-center pt-2">
        Query: &quot;{report.query}&quot; · {new Date(report.timestamp).toLocaleTimeString()}
        {!process.env.NEXT_PUBLIC_HAS_ALL_APIS && ' · GPT & Gemini simulated if API keys absent'}
      </p>
    </div>
  )
}
