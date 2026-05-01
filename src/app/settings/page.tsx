'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SettingsData {
  llmModel: string
  availableModels: { id: string; label: string }[]
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json() as Promise<SettingsData>)
      .then((data) => {
        setSettings(data)
        setSelected(data.llmModel)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ llmModel: selected }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) {
    return <div className="text-gray-400 text-sm">Loading settings…</div>
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI Model
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {settings.availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Model used when generating summaries. Haiku is the default (fast and cost-effective).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">System Prompt</p>
          <p className="text-xs text-gray-400 mt-0.5">Customize the instructions sent to the AI when generating summaries.</p>
        </div>
        <Link
          href="/settings/prompt"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Edit →
        </Link>
      </div>
    </div>
  )
}
