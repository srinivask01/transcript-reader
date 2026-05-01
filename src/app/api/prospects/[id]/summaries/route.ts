import { prisma } from '@/lib/prisma'
import { summarizeTranscripts } from '@/lib/ai/summarization-chain'
import type { TranscriptInput } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prospectId } = await params
  const encoder = new TextEncoder()

  function emit(type: string, data: unknown): Uint8Array {
    return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(emit('progress', { step: 'Loading prospect…' }))

        const prospect = await prisma.prospect.findUnique({
          where: { id: prospectId },
          include: { transcripts: true },
        })

        if (!prospect) {
          controller.enqueue(emit('error', { message: 'Prospect not found' }))
          return
        }

        if (!prospect.transcripts.length) {
          controller.enqueue(emit('error', { message: 'No transcripts uploaded for this prospect' }))
          return
        }

        controller.enqueue(emit('progress', { step: 'Loading AI settings…' }))
        const settings = await prisma.appSettings.findFirst()
        const modelName = settings?.llmModel ?? 'claude-haiku-4-5-20251001'

        const activePromptVersion = await prisma.systemPromptVersion.findFirst({
          where: { status: 'active' },
        })
        const customSystemPrompt = activePromptVersion?.text

        const inputs: TranscriptInput[] = prospect.transcripts.map((t) => ({
          filename: t.filename,
          text: t.extractedText,
        }))

        const transcriptLabel = `${inputs.length} transcript${inputs.length !== 1 ? 's' : ''}`
        controller.enqueue(emit('progress', { step: `Sending ${transcriptLabel} to ${modelName}…` }))

        const { data, systemPrompt, userPrompt } = await summarizeTranscripts(
          inputs,
          modelName,
          customSystemPrompt,
          (step) => controller.enqueue(emit('progress', { step }))
        )

        controller.enqueue(emit('progress', { step: 'Saving analysis…' }))

        const summary = await prisma.summary.create({
          data: {
            prospectId,
            analysisResult: JSON.parse(JSON.stringify(data)),
            systemPrompt,
            userPrompt,
            modelUsed: modelName,
          },
        })

        controller.enqueue(emit('result', { summary }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate summary'
        controller.enqueue(emit('error', { message }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
