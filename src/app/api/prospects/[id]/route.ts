import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      transcripts: { orderBy: { uploadedAt: 'desc' } },
      summaries: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }
  return NextResponse.json(prospect)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.prospect.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
