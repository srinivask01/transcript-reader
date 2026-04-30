'use client'

import { useState } from 'react'
import type { Summary } from '@/types'
import type { CitedItem } from '@/types'

interface Props {
  summaries: Summary[]
}

function CitedItemList({ items, label }: { items: CitedItem[]; label: string }) {
  if (!items.length) return null
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700">
            <span>{item.text}</span>
            <span className="ml-2 text-xs text-blue-400 italic">({item.source})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromptViewer({ summary }: { summary: Summary }) {
  const [open, setOpen] = useState(false)

  if (!summary.systemPrompt && !summary.userPrompt) return null

  return (
    <div className="border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>{open ? 'Hide prompt' : 'View prompt'}</span>
        {summary.modelUsed && (
          <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
            {summary.modelUsed}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {summary.systemPrompt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">System prompt</p>
              <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap break-words">
                {summary.systemPrompt}
              </pre>
            </div>
          )}
          {summary.userPrompt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">User prompt</p>
              <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                {summary.userPrompt}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SummaryList({ summaries }: Props) {
  if (!summaries.length) {
    return <p className="text-sm text-gray-400">No summaries yet. Upload transcripts and click Generate Summary.</p>
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary) => {
        const keyTopics = summary.keyTopics as unknown as CitedItem[]
        const actionItems = summary.actionItems as unknown as CitedItem[]
        const decisions = summary.decisions as unknown as CitedItem[]
        const nextSteps = summary.nextSteps as unknown as CitedItem[]

        return (
          <div key={summary.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="text-xs text-gray-400">
              Generated {new Date(summary.createdAt).toLocaleString()}
            </p>
            <CitedItemList items={keyTopics} label="Key Topics" />
            <CitedItemList items={actionItems} label="Action Items" />
            <CitedItemList items={decisions} label="Decisions Made" />
            <CitedItemList items={nextSteps} label="Next Steps" />
            <PromptViewer summary={summary} />
          </div>
        )
      })}
    </div>
  )
}
