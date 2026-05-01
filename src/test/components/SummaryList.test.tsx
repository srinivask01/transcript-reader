import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryList } from '@/components/summaries/SummaryList'
import type { Summary } from '@/types'

const mockAnalysisResult = {
  transcriptSummary: {
    numberOfTranscripts: 2,
    callsIdentified: ['Call 1 - call1.docx', 'Call 2 - call2.docx'],
    overallProjectSummary: 'Standard ecommerce platform with guest checkout and Stripe payments.',
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
      category: 'Customer Accounts',
      feature: 'Customer login and registration',
      status: 'Conflicting',
      description: 'Allows customers to create accounts.',
      evidence: 'Call 1 requires it. Call 2 defers it.',
      callHistory: 'Call 1: Required. Call 2: Not needed for phase one.',
      assumptions: 'None',
      questions: 'Should accounts be in phase one?',
    },
  ],
  openQuestions: ['Should accounts be in phase one?'],
  implementationNotes: 'Confirm account scope before sprint planning.',
}

const mockSummary: Summary = {
  id: 'sum1',
  prospectId: 'p1',
  createdAt: new Date('2025-05-01T10:00:00Z'),
  analysisResult: mockAnalysisResult,
  systemPrompt: null,
  userPrompt: null,
  modelUsed: null,
}

describe('SummaryList', () => {
  it('shows empty state message when no summaries', () => {
    render(<SummaryList summaries={[]} />)
    expect(screen.getByText(/No summaries yet/)).toBeInTheDocument()
  })

  it('renders transcript summary section', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Transcript Summary')).toBeInTheDocument()
    expect(screen.getByText(/Standard ecommerce platform/)).toBeInTheDocument()
  })

  it('renders feature matrix with category, feature, and status columns', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Feature')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getAllByText('Guest checkout').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Customer login and registration').length).toBeGreaterThanOrEqual(1)
  })

  it('renders status badges', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.getByText('Conflicting')).toBeInTheDocument()
  })

  it('renders open questions section', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Open Questions')).toBeInTheDocument()
    expect(screen.getByText('Should accounts be in phase one?')).toBeInTheDocument()
  })

  it('renders implementation notes', () => {
    render(<SummaryList summaries={[mockSummary]} />)
    expect(screen.getByText('Implementation Notes')).toBeInTheDocument()
    expect(screen.getByText(/Confirm account scope/)).toBeInTheDocument()
  })

  it('renders multiple summaries', () => {
    const second = { ...mockSummary, id: 'sum2', createdAt: new Date('2025-05-02T10:00:00Z') }
    render(<SummaryList summaries={[mockSummary, second]} />)
    expect(screen.getAllByText('Feature Matrix (2 features)')).toHaveLength(2)
  })

  it('renders fallback message for legacy summary with empty analysisResult', () => {
    const legacy = { ...mockSummary, id: 'sum-legacy', analysisResult: {} }
    render(<SummaryList summaries={[legacy as unknown as Summary]} />)
    expect(screen.getByText(/Analysis data is not available/)).toBeInTheDocument()
  })
})
