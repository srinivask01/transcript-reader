import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { SummaryData, TranscriptInput } from '@/types'

const SYSTEM_PROMPT = `You are an expert at analyzing business call transcripts.
Your job is to produce structured summaries that are concise and actionable.
Always cite the source file for every item you identify.
Return ONLY valid JSON — no markdown, no explanation.`

function buildUserPrompt(transcripts: TranscriptInput[]): string {
  const sections = transcripts
    .map((t) => `=== File: ${t.filename} ===\n${t.text}`)
    .join('\n\n')

  return `Analyze the following call transcripts and produce a structured summary.

${sections}

Return a JSON object with exactly this structure:
{
  "keyTopics": [{ "text": "topic description", "source": "filename.docx" }],
  "actionItems": [{ "text": "action item description", "source": "filename.docx" }],
  "decisions": [{ "text": "decision description", "source": "filename.docx" }],
  "nextSteps": [{ "text": "next step description", "source": "filename.docx" }]
}

Rules:
- Each item must have "text" (the content) and "source" (the exact filename it came from)
- An item may appear in multiple sections if relevant
- If a section has no relevant content, return an empty array []
- Return ONLY the JSON object, no other text`
}

export interface SummarizeResult {
  data: SummaryData
  systemPrompt: string
  userPrompt: string
}

export async function summarizeTranscripts(
  transcripts: TranscriptInput[],
  modelName: string
): Promise<SummarizeResult> {
  const userPrompt = buildUserPrompt(transcripts)

  const llm = new ChatAnthropic({
    model: modelName,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0,
  })

  const response = await llm.invoke([
    new SystemMessage({
      content: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    }),
    new HumanMessage({
      content: [{ type: 'text', text: userPrompt, cache_control: { type: 'ephemeral' } }],
    }),
  ])

  const content = typeof response.content === 'string'
    ? response.content
    : response.content.map((c) => ('text' in c ? c.text : '')).join('')

  const json = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const data = JSON.parse(json) as SummaryData
  return { data, systemPrompt: SYSTEM_PROMPT, userPrompt }
}
