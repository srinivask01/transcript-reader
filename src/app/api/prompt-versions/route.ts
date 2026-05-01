import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const versions = await prisma.systemPromptVersion.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(versions)
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { text?: string; notes?: string }
    const { text, notes } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const version = await prisma.systemPromptVersion.create({
      data: { text: text.trim(), notes: notes?.trim() || null, status: 'inactive' },
    })

    return NextResponse.json(version, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
  }
}
