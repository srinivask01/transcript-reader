import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavBar } from '@/components/ui/NavBar'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('NavBar', () => {
  it('renders the app title', () => {
    render(<NavBar />)
    expect(screen.getByText('Transcript Reader')).toBeInTheDocument()
  })

  it('renders Prospects and Settings links', () => {
    render(<NavBar />)
    expect(screen.getByText('Prospects')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('Prospects link points to /', () => {
    render(<NavBar />)
    const link = screen.getByText('Prospects').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('Settings link points to /settings', () => {
    render(<NavBar />)
    const link = screen.getByText('Settings').closest('a')
    expect(link).toHaveAttribute('href', '/settings')
  })
})
