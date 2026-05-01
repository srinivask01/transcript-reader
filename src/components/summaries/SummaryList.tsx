'use client'

import { useState } from 'react'
import type { Summary } from '@/types'
import type { AnalysisResult, FeatureRow, FeatureStatus } from '@/types'

interface Props {
  summaries: Summary[]
}

const STATUS_STYLES: Record<FeatureStatus, string> = {
  'Required': 'bg-green-100 text-green-800',
  'Likely required': 'bg-blue-100 text-blue-800',
  'Optional': 'bg-gray-100 text-gray-600',
  'Not relevant': 'bg-gray-50 text-gray-400',
  'Conflicting': 'bg-red-100 text-red-700',
  'Needs clarification': 'bg-amber-100 text-amber-700',
}

const STATUS_ORDER: FeatureStatus[] = [
  'Required',
  'Likely required',
  'Optional',
  'Needs clarification',
  'Conflicting',
  'Not relevant',
]

function StatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function FeatureTable({ features }: { features: FeatureRow[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Feature</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {features.map((row, i) => (
            <>
              <tr
                key={i}
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className={`cursor-pointer transition-colors ${expandedIndex === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-3 text-gray-500 text-xs">{row.category}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{row.feature}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
              {expandedIndex === i && (
                <tr key={`${i}-detail`} className="bg-blue-50">
                  <td colSpan={3} className="px-4 py-4">
                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <Detail label="Description" value={row.description} />
                      <Detail label="Evidence" value={row.evidence} />
                      <Detail label="Call History" value={row.callHistory} highlight={row.status === 'Conflicting'} />
                      <Detail label="Assumptions" value={row.assumptions} />
                      <Detail label="Questions" value={row.questions} />
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  if (!value || value === 'None') return null
  return (
    <div>
      <span className={`font-semibold uppercase tracking-wide ${highlight ? 'text-red-600' : 'text-gray-500'}`}>
        {label}:{' '}
      </span>
      <span className={highlight ? 'text-red-700' : 'text-gray-700'}>{value}</span>
    </div>
  )
}

function SummarySection({ title, features, showCallHistory }: { title: string; features: FeatureRow[]; showCallHistory?: boolean }) {
  if (!features.length) return null
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title} ({features.length})</h4>
      <ul className="space-y-1">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-gray-700">
            <span className="font-medium">{f.feature}</span>
            <span className="text-gray-400 ml-1">— {f.category}</span>
            {showCallHistory && f.callHistory && f.callHistory !== 'None' && (
              <p className="text-xs text-red-600 mt-0.5 ml-2">{f.callHistory}</p>
            )}
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
          <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{summary.modelUsed}</span>
        )}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {summary.systemPrompt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">System prompt</p>
              <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{summary.systemPrompt}</pre>
            </div>
          )}
          {summary.userPrompt && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">User prompt</p>
              <pre className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">{summary.userPrompt}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnalysisCard({ summary }: { summary: Summary }) {
  const result = summary.analysisResult as unknown as AnalysisResult

  if (!result?.transcriptSummary) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs text-gray-400">Generated {new Date(summary.createdAt).toLocaleString()}</p>
        <p className="text-sm text-gray-400 mt-3">Analysis data is not available for this summary. Re-run the analysis to generate a new one.</p>
      </div>
    )
  }

  const { transcriptSummary, features = [], openQuestions = [], implementationNotes } = result

  const byStatus = (status: FeatureStatus) => features.filter((f) => f.status === status)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-400">Generated {new Date(summary.createdAt).toLocaleString()}</p>
      </div>

      {/* Transcript summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Transcript Summary</p>
        <p className="text-sm text-gray-700">{transcriptSummary.overallProjectSummary}</p>
        <p className="text-xs text-gray-400 mt-1">
          {transcriptSummary.numberOfTranscripts} transcript{transcriptSummary.numberOfTranscripts !== 1 ? 's' : ''} —{' '}
          {transcriptSummary.callsIdentified.join(', ')}
        </p>
      </div>

      {/* Feature matrix */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Feature Matrix ({features.length} features)
        </p>
        <FeatureTable features={features} />
      </div>

      {/* Computed summary sections */}
      <div className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5">
        {STATUS_ORDER.map((status) => (
          <SummarySection
            key={status}
            title={status}
            features={byStatus(status)}
            showCallHistory={status === 'Conflicting'}
          />
        ))}
      </div>

      {/* Open questions */}
      {openQuestions.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Open Questions</p>
          <ul className="space-y-1 list-disc list-inside">
            {openQuestions.map((q, i) => (
              <li key={i} className="text-sm text-gray-700">{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Implementation notes */}
      {implementationNotes && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Implementation Notes</p>
          <p className="text-sm text-gray-700">{implementationNotes}</p>
        </div>
      )}

      <PromptViewer summary={summary} />
    </div>
  )
}

export function SummaryList({ summaries }: Props) {
  if (!summaries.length) {
    return <p className="text-sm text-gray-400">No summaries yet. Upload transcripts and click Generate Summary.</p>
  }

  return (
    <div className="space-y-6">
      {summaries.map((summary) => (
        <AnalysisCard key={summary.id} summary={summary} />
      ))}
    </div>
  )
}
