import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const prospects = await prisma.prospect.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { transcripts: true, summaries: true } } },
  })
  return NextResponse.json(prospects)
}

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; company?: string }
  const { name, company } = body

  if (!name?.trim() || !company?.trim()) {
    return NextResponse.json({ error: 'Name and company are required' }, { status: 400 })
  }

  const prospect = await prisma.prospect.create({
    data: { name: name.trim(), company: company.trim() },
  })
  return NextResponse.json(prospect, { status: 201 })
}
