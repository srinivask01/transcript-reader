import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const version = await prisma.systemPromptVersion.findUnique({ where: { id } })
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.systemPromptVersion.updateMany({ data: { status: 'inactive' } }),
      prisma.systemPromptVersion.update({ where: { id }, data: { status: 'active' } }),
    ])

    const updated = await prisma.systemPromptVersion.findUnique({ where: { id } })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to activate version' }, { status: 500 })
  }
}
