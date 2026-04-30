import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const transcript = await prisma.transcript.findUnique({ where: { id } })
  if (!transcript) {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
  }

  await unlink(transcript.filePath).catch(() => {})
  await prisma.transcript.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
