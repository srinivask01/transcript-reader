import { describe, it, expect } from 'vitest'
import { calculateCost, formatCost } from '@/lib/ai/pricing'
import type { TokenUsage } from '@/lib/ai/pricing'

const usage: TokenUsage = {
  inputTokens:      10000,
  cacheWriteTokens: 1000,
  cacheReadTokens:  5000,
  outputTokens:     2000,
}

describe('calculateCost', () => {
  it('returns correct cost for known model', () => {
    const result = calculateCost('claude-haiku-4-5-20251001', usage)
    expect(result.modelKnown).toBe(true)
    expect(result.totalUsd).toBeCloseTo(
      (10000 * 0.80 + 1000 * 1.00 + 5000 * 0.08 + 2000 * 4.00) / 1_000_000,
      8
    )
  })

  it('returns modelKnown false for unknown model', () => {
    const result = calculateCost('claude-unknown-99', usage)
    expect(result.modelKnown).toBe(false)
    expect(result.totalUsd).toBeNull()
  })
})

describe('formatCost', () => {
  it('formats cost to 4 decimal places', () => {
    const result = calculateCost('claude-haiku-4-5-20251001', usage)
    expect(formatCost(result, 1)).toMatch(/^\$\d+\.\d{4}$/)
  })

  it('appends call count suffix when greater than 1', () => {
    const result = calculateCost('claude-haiku-4-5-20251001', usage)
    expect(formatCost(result, 2)).toContain('(2 calls)')
    expect(formatCost(result, 1)).not.toContain('calls')
  })

  it('returns Price unknown for unknown model without call suffix when 1 call', () => {
    const result = calculateCost('claude-unknown-99', usage)
    expect(formatCost(result, 1)).toBe('Price unknown')
  })

  it('returns Price unknown with call suffix for unknown model with retry', () => {
    const result = calculateCost('claude-unknown-99', usage)
    expect(formatCost(result, 2)).toBe('Price unknown (2 calls)')
  })
})
