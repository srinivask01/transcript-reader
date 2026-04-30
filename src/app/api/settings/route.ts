import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const AVAILABLE_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku (fast, cheap)' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet (balanced)' },
  { id: 'claude-opus-4-7', label: 'Claude Opus (most capable)' },
]

export async function GET() {
  const settings = await prisma.appSettings.findFirst()
  return NextResponse.json({
    llmModel: settings?.llmModel ?? 'claude-haiku-4-5-20251001',
    availableModels: AVAILABLE_MODELS,
  })
}

export async function PUT(request: Request) {
  const body = await request.json() as { llmModel?: string }
  const { llmModel } = body

  if (!llmModel) {
    return NextResponse.json({ error: 'llmModel is required' }, { status: 400 })
  }

  const existing = await prisma.appSettings.findFirst()

  const settings = existing
    ? await prisma.appSettings.update({ where: { id: existing.id }, data: { llmModel } })
    : await prisma.appSettings.create({ data: { id: 'default', llmModel } })

  return NextResponse.json(settings)
}
