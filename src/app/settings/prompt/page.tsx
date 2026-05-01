'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_PROMPT = `You are an expert at analyzing business call transcripts.
Your job is to produce structured summaries that are concise and actionable.
Always cite the source file for every item you identify.
Return ONLY valid JSON — no markdown, no explanation.`

interface PromptVersion {
  id: string
  text: string
  notes: string | null
  status: string
  createdAt: string
}

export default function PromptEditorPage() {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [editorText, setEditorText] = useState(DEFAULT_PROMPT)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [])

  async function loadVersions() {
    const res = await fetch('/api/prompt-versions')
    const data = await res.json() as PromptVersion[]
    setVersions(data)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/prompt-versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editorText, notes }),
    })
    setSaving(false)
    setSaved(true)
    setNotes('')
    setTimeout(() => setSaved(false), 2000)
    await loadVersions()
  }

  async function handleActivate(id: string) {
    setActivating(id)
    await fetch(`/api/prompt-versions/${id}/activate`, { method: 'PUT' })
    setActivating(null)
    await loadVersions()
  }

  function handleLoad(version: PromptVersion) {
    setEditorText(version.text)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeVersion = versions.find((v) => v.status === 'active')

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Settings
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-2xl font-bold text-gray-900">System Prompt</h1>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {activeVersion
              ? <span>Active version saved <span className="font-medium text-gray-700">{formatDate(activeVersion.createdAt)}</span></span>
              : <span className="text-amber-600">No active version — using built-in default</span>
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt text</label>
          <textarea
            value={editorText}
            onChange={(e) => setEditorText(e.target.value)}
            rows={12}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Enter system prompt…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Added focus on sales objections"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !editorText.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save as new version'}
        </button>
      </div>

      {/* Version history */}
      {versions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Version history</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {versions.map((v, i) => (
              <li key={v.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">
                        v{versions.length - i}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(v.createdAt)}</span>
                      {v.status === 'active' && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    {v.notes && (
                      <p className="text-sm text-gray-700 mb-1">{v.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 font-mono truncate">{v.text.split('\n')[0]}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleLoad(v)}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Load
                    </button>
                    {v.status !== 'active' && (
                      <button
                        onClick={() => handleActivate(v.id)}
                        disabled={activating === v.id}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {activating === v.id ? 'Activating…' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
