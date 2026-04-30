import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { summarizeTranscripts } from '@/lib/ai/summarization-chain'
import type { TranscriptInput } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prospectId } = await params

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { transcripts: true },
  })

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }

  if (!prospect.transcripts.length) {
    return NextResponse.json({ error: 'No transcripts uploaded for this prospect' }, { status: 400 })
  }

  const settings = await prisma.appSettings.findFirst()
  const modelName = settings?.llmModel ?? 'claude-haiku-4-5-20251001'

  const inputs: TranscriptInput[] = prospect.transcripts.map((t) => ({
    filename: t.filename,
    text: t.extractedText,
  }))

  try {
    const { data: summaryData, systemPrompt, userPrompt } = await summarizeTranscripts(inputs, modelName)

    const summary = await prisma.summary.create({
      data: {
        prospectId,
        keyTopics: JSON.parse(JSON.stringify(summaryData.keyTopics)),
        actionItems: JSON.parse(JSON.stringify(summaryData.actionItems)),
        decisions: JSON.parse(JSON.stringify(summaryData.decisions)),
        nextSteps: JSON.parse(JSON.stringify(summaryData.nextSteps)),
        systemPrompt,
        userPrompt,
        modelUsed: modelName,
      },
    })

    return NextResponse.json(summary, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate summary'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
