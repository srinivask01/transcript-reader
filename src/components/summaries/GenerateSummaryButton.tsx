'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  prospectId: string
  hasTranscripts: boolean
}

export function GenerateSummaryButton({ prospectId, hasTranscripts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [error, setError] = useState('')

  async function handleGenerate() {
    setError('')
    setStep('Starting…')
    setLoading(true)

    try {
      const res = await fetch(`/api/prospects/${prospectId}/summaries`, { method: 'POST' })

      if (!res.body) throw new Error('No response body from server')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventType = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6)) as { step?: string; message?: string }
            if (eventType === 'progress' && data.step) setStep(data.step)
            if (eventType === 'error') throw new Error(data.message ?? 'Unknown error')
          }
        }
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading || !hasTranscripts}
        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40"
        title={!hasTranscripts ? 'Upload transcripts first' : ''}
      >
        {loading ? 'Generating…' : 'Generate Summary'}
      </button>
      {loading && step && (
        <p className="text-xs text-gray-400 animate-pulse">{step}</p>
      )}
      {error && <p className="text-red-500 text-xs max-w-xs text-right">{error}</p>}
    </div>
  )
}
