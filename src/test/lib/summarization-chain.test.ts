import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TranscriptInput } from '@/types'

const mockInvoke = vi.fn()

vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn().mockImplementation(function () {
    return { invoke: mockInvoke }
  }),
}))

const mockAnalysisResult = {
  transcriptSummary: {
    numberOfTranscripts: 2,
    callsIdentified: ['Call 1 - call1.docx', 'Call 2 - call2.docx'],
    overallProjectSummary: 'Standard ecommerce platform required.',
  },
  features: [
    {
      category: 'Checkout',
      feature: 'Guest checkout',
      status: 'Required',
      description: 'Allows checkout without account.',
      evidence: 'Call 1 mentions guest checkout.',
      callHistory: 'Call 1: Required.',
      assumptions: 'None',
      questions: 'None',
    },
    {
      category: 'Payments',
      feature: 'Stripe integration',
      status: 'Required',
      description: 'Stripe payment processing.',
      evidence: 'Call 2 mentions Stripe.',
      callHistory: 'Call 2: Required.',
      assumptions: 'Stripe is the primary gateway.',
      questions: 'Are Apple Pay and Google Pay required?',
    },
  ],
  openQuestions: ['Are Apple Pay and Google Pay required?'],
  implementationNotes: 'Stripe is a hard dependency for checkout.',
}

describe('summarizeTranscripts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockInvoke.mockResolvedValue({ content: JSON.stringify(mockAnalysisResult) })
  })

  it('returns parsed analysis result', async () => {
    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [
      { filename: 'call1.docx', text: 'We discussed pricing.' },
      { filename: 'call2.docx', text: 'We agreed to move forward.' },
    ]

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')

    expect(result.data.features).toHaveLength(2)
    expect(result.data.features[0].status).toBe('Required')
    expect(result.data.transcriptSummary.numberOfTranscripts).toBe(2)
    expect(result.data.openQuestions).toHaveLength(1)
    expect(result.data.implementationNotes).toBeTruthy()
    expect(result.systemPrompt).toBeTruthy()
    expect(result.userPrompt).toContain('call1.docx')
  })

  it('labels transcripts with call number and filename in user prompt', async () => {
    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [
      { filename: 'call1.docx', text: 'Content A.' },
      { filename: 'call2.docx', text: 'Content B.' },
    ]

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')

    expect(result.userPrompt).toContain('Call 1')
    expect(result.userPrompt).toContain('Call 2')
    expect(result.userPrompt).toContain('call1.docx')
    expect(result.userPrompt).toContain('call2.docx')
  })

  it('strips code fences from AI response before parsing', async () => {
    mockInvoke.mockResolvedValueOnce({
      content: '```json\n' + JSON.stringify(mockAnalysisResult) + '\n```',
    })

    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'test.docx', text: 'content' }]

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')
    expect(result.data.features).toHaveLength(2)
  })

  it('uses custom system prompt when provided', async () => {
    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'test.docx', text: 'content' }]
    const custom = 'Custom system prompt text'

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001', custom)
    expect(result.systemPrompt).toBe(custom)
  })

  it('extracts JSON when LLM response has leading markdown heading before the object', async () => {
    mockInvoke.mockResolvedValueOnce({
      content: '# BRIDGEPOINT RETAIL ANALYSIS\n\nHere is the structured analysis:\n\n' + JSON.stringify(mockAnalysisResult),
    })

    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'test.docx', text: 'content' }]

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')
    expect(result.data.features).toHaveLength(2)
    expect(result.data.transcriptSummary.overallProjectSummary).toBeTruthy()
  })

  it('extracts JSON when LLM response has trailing text after the object', async () => {
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify(mockAnalysisResult) + '\n\nLet me know if you need clarification.',
    })

    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'test.docx', text: 'content' }]

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')
    expect(result.data.features).toHaveLength(2)
  })

  it('retries and succeeds when first response is prose and second is valid JSON', async () => {
    mockInvoke
      .mockResolvedValueOnce({ content: '# BRIDGEPORT HARDWARE — ECOMMERCE REQUIREMENTS ANALYSIS\n\nExecutive summary here.' })
      .mockResolvedValueOnce({ content: JSON.stringify(mockAnalysisResult) })

    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'test.docx', text: 'content' }]
    const steps: string[] = []

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001', undefined, (s) => steps.push(s))

    expect(result.data.features).toHaveLength(2)
    expect(steps).toContain('Model returned prose — retrying for JSON…')
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })

  it('throws a descriptive error when both attempts return no JSON object', async () => {
    mockInvoke
      .mockResolvedValueOnce({ content: '# BRIDGEPOINT\n\nSorry, I cannot provide that.' })
      .mockResolvedValueOnce({ content: 'Still no JSON here.' })

    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'bad.docx', text: 'content' }]

    await expect(summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001'))
      .rejects.toThrow('LLM response did not contain a JSON object')
  })
})
