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
  const [error, setError] = useState('')

  async function handleGenerate() {
    setError('')
    setLoading(true)

    const res = await fetch(`/api/prospects/${prospectId}/summaries`, {
      method: 'POST',
    })

    if (!res.ok) {
      const text = await res.text()
      let message = 'Failed to generate summary'
      try {
        const data = JSON.parse(text) as { error: string }
        message = data.error ?? message
      } catch {}
      setError(message)
    } else {
      router.refresh()
    }
    setLoading(false)
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
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
