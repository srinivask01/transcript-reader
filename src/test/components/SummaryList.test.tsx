import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryList } from '@/components/summaries/SummaryList'
import type { Summary } from '@/types'

const mockSummary: Summary = {
  id: 'sum1',
  prospectId: 'p1',
  createdAt: new Date('2025-05-01T10:00:00Z'),
  keyTopics: [{ text: 'Pricing discussion', source: 'call1.docx' }],
  actionItems: [{ text: 'Send proposal', source: 'call1.docx' }],
  decisions: [{ text: 'Proceed to demo', source: 'call2.docx' }],
  nextSteps: [{ text: 'Schedule demo next week', source: 'call2.docx' }],
  systemPrompt: null,
  userPrompt: null,
  modelUsed: null,
}

describe('SummaryList', () => {
  it('shows empty state message when no summaries', () => {
    render(<SummaryList summaries={[]} />)
    expect(screen.getByText(/No summaries yet/)).toBeInTheDocument()
  })

  it('renders all four sections', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Key Topics')).toBeInTheDocument()
    expect(screen.getByText('Action Items')).toBeInTheDocument()
    expect(screen.getByText('Decisions Made')).toBeInTheDocument()
    expect(screen.getByText('Next Steps')).toBeInTheDocument()
  })

  it('renders item text with source citation', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Pricing discussion')).toBeInTheDocument()
    // call1.docx appears in both Key Topics and Action Items
    const citations = screen.getAllByText('(call1.docx)')
    expect(citations.length).toBeGreaterThanOrEqual(1)
  })

  it('renders multiple summaries', () => {
    const second = { ...mockSummary, id: 'sum2', createdAt: new Date('2025-05-02T10:00:00Z') }
    render(<SummaryList summaries={[mockSummary, second]} />)
    expect(screen.getAllByText('Key Topics')).toHaveLength(2)
  })
})
