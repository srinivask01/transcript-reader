'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Transcript } from '@/types'

interface Props {
  transcripts: Transcript[]
}

export function TranscriptList({ transcripts }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/transcripts/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    router.refresh()
  }

  if (!transcripts.length) {
    return <p className="text-sm text-gray-400">No transcripts uploaded yet.</p>
  }

  return (
    <ul className="space-y-2">
      {transcripts.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{t.filename}</p>
            <p className="text-xs text-gray-400">
              {new Date(t.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleDelete(t.id)}
            disabled={deletingId === t.id}
            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
          >
            {deletingId === t.id ? '…' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  )
}
