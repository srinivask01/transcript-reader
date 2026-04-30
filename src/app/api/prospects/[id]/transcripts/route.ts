import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { extractTextFromDocx } from '@/lib/extract-docx'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prospectId } = await params

  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } })
  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', prospectId)
  await mkdir(uploadsDir, { recursive: true })

  const created = await Promise.all(
    files.map(async (file) => {
      if (!file.name.endsWith('.docx')) {
        throw new Error(`File "${file.name}" is not a .docx file`)
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const filePath = path.join(uploadsDir, file.name)
      await writeFile(filePath, buffer)

      const extractedText = await extractTextFromDocx(buffer)

      return prisma.transcript.create({
        data: {
          prospectId,
          filename: file.name,
          filePath,
          extractedText,
        },
      })
    })
  )

  return NextResponse.json(created, { status: 201 })
}
