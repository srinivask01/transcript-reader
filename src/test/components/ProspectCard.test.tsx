import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProspectCard } from '@/components/prospects/ProspectCard'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockProspect = {
  id: 'abc123',
  name: 'Jane Smith',
  company: 'Acme Corp',
  createdAt: new Date('2025-01-01'),
  _count: { transcripts: 3, summaries: 1 },
}

describe('ProspectCard', () => {
  it('renders contact name and company', () => {
    render(<ProspectCard prospect={mockProspect} />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('renders transcript and summary counts', () => {
    render(<ProspectCard prospect={mockProspect} />)
    expect(screen.getByText('3 transcripts')).toBeInTheDocument()
    expect(screen.getByText('1 summary')).toBeInTheDocument()
  })

  it('links to the prospect detail page', () => {
    render(<ProspectCard prospect={mockProspect} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/prospects/abc123')
  })

  it('handles singular transcript/summary labels', () => {
    const single = { ...mockProspect, _count: { transcripts: 1, summaries: 2 } }
    render(<ProspectCard prospect={single} />)
    expect(screen.getByText('1 transcript')).toBeInTheDocument()
  })
})
