// Prices in USD per token (converted from per-million rates)
// Source: https://www.anthropic.com/pricing — update here when Anthropic reprices
const PRICING: Record<string, { input: number; cacheWrite: number; cacheRead: number; output: number }> = {
  'claude-haiku-4-5-20251001': {
    input:      0.80  / 1_000_000,
    cacheWrite: 1.00  / 1_000_000,
    cacheRead:  0.08  / 1_000_000,
    output:     4.00  / 1_000_000,
  },
  'claude-sonnet-4-6': {
    input:      3.00  / 1_000_000,
    cacheWrite: 3.75  / 1_000_000,
    cacheRead:  0.30  / 1_000_000,
    output:     15.00 / 1_000_000,
  },
  'claude-opus-4-7': {
    input:      15.00 / 1_000_000,
    cacheWrite: 18.75 / 1_000_000,
    cacheRead:  1.50  / 1_000_000,
    output:     75.00 / 1_000_000,
  },
}

export interface TokenUsage {
  inputTokens:      number
  cacheWriteTokens: number
  cacheReadTokens:  number
  outputTokens:     number
}

export interface CostResult {
  totalUsd:    number | null  // null = model not in pricing table
  modelKnown:  boolean
}

export function calculateCost(model: string, usage: TokenUsage): CostResult {
  const prices = PRICING[model]
  if (!prices) return { totalUsd: null, modelKnown: false }

  const totalUsd =
    usage.inputTokens      * prices.input +
    usage.cacheWriteTokens * prices.cacheWrite +
    usage.cacheReadTokens  * prices.cacheRead +
    usage.outputTokens     * prices.output

  return { totalUsd, modelKnown: true }
}

export function formatCost(result: CostResult, llmCallCount: number): string {
  const callSuffix = llmCallCount > 1 ? ` (${llmCallCount} calls)` : ''
  if (!result.modelKnown) return `Price unknown${callSuffix}`
  return `$${result.totalUsd!.toFixed(4)}${callSuffix}`
}
