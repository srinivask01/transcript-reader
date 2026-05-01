import type { Prospect, Transcript, Summary, AppSettings } from '@/generated/prisma/client'

export type { Prospect, Transcript, Summary, AppSettings }

export type FeatureStatus =
  | 'Required'
  | 'Likely required'
  | 'Optional'
  | 'Not relevant'
  | 'Conflicting'
  | 'Needs clarification'

export interface FeatureRow {
  category: string
  feature: string
  status: FeatureStatus
  description: string
  evidence: string
  callHistory: string
  assumptions: string
  questions: string
}

export interface TranscriptSummary {
  numberOfTranscripts: number
  callsIdentified: string[]
  overallProjectSummary: string
}

export interface AnalysisResult {
  transcriptSummary: TranscriptSummary
  features: FeatureRow[]
  openQuestions: string[]
  implementationNotes: string
}

export interface ProspectWithRelations extends Prospect {
  transcripts: Transcript[]
  summaries: Summary[]
}

export interface TranscriptInput {
  filename: string
  text: string
}
