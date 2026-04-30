import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TranscriptInput } from '@/types'

const mockInvoke = vi.fn()

vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn().mockImplementation(function () {
    return { invoke: mockInvoke }
  }),
}))

describe('summarizeTranscripts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        keyTopics: [{ text: 'Pricing discussion', source: 'call1.docx' }],
        actionItems: [{ text: 'Send proposal', source: 'call1.docx' }],
        decisions: [{ text: 'Move to next stage', source: 'call2.docx' }],
        nextSteps: [{ text: 'Follow up next week', source: 'call2.docx' }],
      }),
    })
  })

  it('returns parsed structured summary data', async () => {
    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [
      { filename: 'call1.docx', text: 'We discussed pricing.' },
      { filename: 'call2.docx', text: 'We agreed to move forward.' },
    ]

    const result = await summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')

    expect(result.data.keyTopics).toHaveLength(1)
    expect(result.data.keyTopics[0].source).toBe('call1.docx')
    expect(result.data.actionItems[0].text).toBe('Send proposal')
    expect(result.data.decisions[0].text).toBe('Move to next stage')
    expect(result.data.nextSteps[0].source).toBe('call2.docx')
    expect(result.systemPrompt).toBeTruthy()
    expect(result.userPrompt).toContain('call1.docx')
  })

  it('throws on invalid JSON response', async () => {
    mockInvoke.mockResolvedValueOnce({ content: 'not valid json' })

    const { summarizeTranscripts } = await import('@/lib/ai/summarization-chain')
    const inputs: TranscriptInput[] = [{ filename: 'bad.docx', text: 'content' }]

    await expect(summarizeTranscripts(inputs, 'claude-haiku-4-5-20251001')).rejects.toThrow()
  })
})
