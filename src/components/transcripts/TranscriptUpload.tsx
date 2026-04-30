'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  prospectId: string
}

export function TranscriptUpload({ prospectId }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    setUploading(true)

    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))

    const res = await fetch(`/api/prospects/${prospectId}/transcripts`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json() as { error: string }
      setError(data.error ?? 'Upload failed')
    } else {
      router.refresh()
    }
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-gray-500">
          {uploading ? 'Uploading…' : 'Drop .docx files here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Supports multiple files</p>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
