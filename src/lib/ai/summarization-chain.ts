import { ChatAnthropic } from '@langchain/anthropic'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { AnalysisResult, TranscriptInput } from '@/types'
import type { TokenUsage } from '@/lib/ai/pricing'

const SYSTEM_PROMPT = `You are an AI ecommerce requirements analyst. Your task is to analyze one or more call transcripts and generate a structured list of key ecommerce implementation features.

The transcripts may come from introductory calls, discovery calls, or scoping sessions. Requirements may be described at a high level, indirectly, or inconsistently across calls.

Your output must identify all relevant ecommerce features, including standard ecommerce functionality that may not be explicitly mentioned. A missing mention does not mean the feature is not required.

---

## Context
- The inputs are call transcripts provided to you as plain text (extracted from DOCX files by the application).
- Each transcript may represent a different call, such as Call 1, Call 2, Call 3, or similar.
- Ecommerce implementations usually include standard functionality even when clients do not explicitly mention every feature.
- You must consider both explicitly stated requirements and commonly expected ecommerce capabilities.
- If a feature is not relevant, still list it and flag it as Not relevant.
- If there is a conflict between transcripts, capture the conflict history against the feature.
- Example conflict:
  - Call 1 says customer accounts are required.
  - Call 2 says customer accounts are not needed.
  - The feature must be marked as Conflicting and include both call references.

---

## Input
- The transcript text is extracted from DOCX files by the application and provided to you as plain text.
- Each transcript is labelled with its filename. Use the filename to identify the call.
- You do not need to read or parse files — the extracted text is your only input.

---

## Instructions
1. Read and analyze all provided transcript texts.
2. Identify each transcript as Call 1, Call 2, Call 3, etc.
   - Use the file name, date, or order provided.
   - If call order is unclear, use the uploaded file order.
3. Extract ecommerce requirements from each transcript.
4. Identify standard ecommerce features even if they are not explicitly mentioned.
5. Classify every feature using one of the following statuses:
   - Required
   - Likely required
   - Optional
   - Not relevant
   - Conflicting
   - Needs clarification
6. Do not treat silence as rejection.
   - If a standard ecommerce feature is not mentioned but is typically needed, mark it as Likely required or Needs clarification.
7. If a feature is explicitly rejected, mark it as Not relevant.
8. If different calls contain different decisions for the same feature, mark it as Conflicting.
9. For every feature, include:
   - Feature name
   - Feature category
   - Status
   - Description
   - Evidence from transcript
   - Call history
   - Assumptions
   - Clarifying questions if needed
10. Use clear, implementation-friendly language.
11. Avoid vague statements.
12. Do not invent highly specific requirements unless supported by the transcript.
13. When making a standard ecommerce assumption, clearly label it as an assumption.
14. Separate confirmed requirements from inferred or assumed requirements.
15. Collect ALL clarifying questions into the \`openQuestions\` array. Every non-"None" value that appears in a feature's \`questions\` field must also appear in \`openQuestions\`. Additional cross-cutting questions not tied to a single feature should be included too.
16. Summarise key implementation considerations in the \`implementationNotes\` field.

---

## Final Notes
- Always include standard ecommerce features even if they are not mentioned.
- Do not exclude a feature only because it is absent from the transcript.
- If a feature is not relevant, list it and mark it as Not relevant.
- If there is conflicting information across calls, show the full history against that feature.
- Use the following ecommerce feature categories as a starting checklist:
  - Storefront
  - Product catalog
  - Product detail pages
  - Product search
  - Product filtering and sorting
  - Shopping cart
  - Checkout (including guest checkout)
  - Customer accounts (login, registration, profile)
  - Order history
  - Wishlist
  - Payments
  - Refunds
  - Taxes
  - Shipping and delivery options
  - Inventory management
  - Promotions and discounts
  - Coupons
  - Gift cards
  - Product reviews and ratings
  - Recommendations
  - CMS pages
  - Blog or content hub
  - SEO
  - Analytics and tracking
  - Email notifications
  - SMS notifications
  - Admin dashboard
  - Order management
  - Returns and exchanges
  - Customer support (including live chat)
  - CRM integration
  - ERP integration
  - POS integration
  - Marketplace integration
  - Subscription products
  - Digital products
  - B2B ecommerce
  - Multi-currency
  - Multi-language
  - Accessibility
  - Security
  - Privacy and compliance
  - Performance
  - Mobile responsiveness
  - Other third-party integrations not listed above

Final output format:

Return a single JSON object with exactly this structure:

{
  "transcriptSummary": {
    "numberOfTranscripts": <number>,
    "callsIdentified": [<string>, ...],
    "overallProjectSummary": <string>
  },
  "features": [
    {
      "category": <string>,
      "feature": <string>,
      "status": <"Required" | "Likely required" | "Optional" | "Not relevant" | "Conflicting" | "Needs clarification">,
      "description": <string>,
      "evidence": <string>,
      "callHistory": <string>,
      "assumptions": <string>,
      "questions": <string>
    }
  ],
  "openQuestions": [<string>, ...],
  "implementationNotes": <string>
}

Rules:
- Return ONLY the JSON object — no markdown, no explanation, no code fences.
- Every feature row must include all 8 fields. Use "None" if a field is not applicable.
- The \`status\` field must be exactly one of: "Required", "Likely required", "Optional", "Not relevant", "Conflicting", "Needs clarification".
- \`openQuestions\` must be a flat array of strings, one question per element.
- \`callsIdentified\` must be a flat array of strings, one entry per transcript.
- BE CONCISE. Every string field must be 1–2 sentences maximum. Do not quote transcript text verbatim — summarise instead. The entire JSON response must be as compact as possible.`

function extractJson(content: string): string {
  const stripped = content.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `LLM response did not contain a JSON object. Response started with: "${content.slice(0, 120)}"`
    )
  }
  return stripped.slice(start, end + 1)
}

function buildUserPrompt(transcripts: TranscriptInput[]): string {
  const sections = transcripts
    .map((t, i) => `=== Call ${i + 1} — File: ${t.filename} ===\n${t.text}`)
    .join('\n\n')

  return `Analyze the following call transcripts and produce a structured ecommerce requirements analysis.\n\n${sections}`
}

export interface SummarizeResult {
  data: AnalysisResult
  systemPrompt: string
  userPrompt: string
  usage: TokenUsage
  llmCallCount: number
}

function extractContent(response: { content: unknown }): string {
  return typeof response.content === 'string'
    ? response.content
    : (response.content as Array<unknown>)
        .map((c) => (c && typeof c === 'object' && 'text' in c ? (c as { text: string }).text : ''))
        .join('')
}

export async function summarizeTranscripts(
  transcripts: TranscriptInput[],
  modelName: string,
  customSystemPrompt?: string,
  onProgress?: (step: string) => void
): Promise<SummarizeResult> {
  const activeSystemPrompt = customSystemPrompt ?? SYSTEM_PROMPT
  const userPrompt = buildUserPrompt(transcripts)

  const llm = new ChatAnthropic({
    model: modelName,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0,
    maxTokens: 32768,
    streaming: true,
    clientOptions: {
      defaultHeaders: { 'anthropic-beta': 'output-128k-2025-02-19' },
    },
  })

  const systemMessage = new SystemMessage({
    content: [{ type: 'text', text: activeSystemPrompt, cache_control: { type: 'ephemeral' } }],
  })
  const humanMessage = new HumanMessage({
    content: [{ type: 'text', text: userPrompt, cache_control: { type: 'ephemeral' } }],
  })

  function extractUsage(response: { usage_metadata?: { input_tokens?: number; output_tokens?: number; input_token_details?: { cache_creation?: number; cache_read?: number } } }): TokenUsage {
    const meta = response.usage_metadata ?? {}
    const details = meta.input_token_details ?? {}
    return {
      inputTokens:      meta.input_tokens      ?? 0,
      cacheWriteTokens: details.cache_creation  ?? 0,
      cacheReadTokens:  details.cache_read       ?? 0,
      outputTokens:     meta.output_tokens      ?? 0,
    }
  }

  function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
    return {
      inputTokens:      a.inputTokens      + b.inputTokens,
      cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
      cacheReadTokens:  a.cacheReadTokens  + b.cacheReadTokens,
      outputTokens:     a.outputTokens     + b.outputTokens,
    }
  }

  const response = await llm.invoke([systemMessage, humanMessage])
  const content = extractContent(response)
  let usage = extractUsage(response)
  let llmCallCount = 1

  let json: string
  try {
    json = extractJson(content)
  } catch {
    onProgress?.('Model returned prose — retrying for JSON…')
    const retryResponse = await llm.invoke([
      systemMessage,
      humanMessage,
      new AIMessage({ content }),
      new HumanMessage({
        content: 'Your response was not in the required format. Output ONLY the raw JSON object — no headings, no prose, no markdown. Start with { and end with }.',
      }),
    ])
    json = extractJson(extractContent(retryResponse))
    usage = addUsage(usage, extractUsage(retryResponse))
    llmCallCount = 2
  }

  const data = JSON.parse(json) as AnalysisResult
  return { data, systemPrompt: activeSystemPrompt, userPrompt, usage, llmCallCount }
}
