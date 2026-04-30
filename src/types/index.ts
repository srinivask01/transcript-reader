import type { Prospect, Transcript, Summary, AppSettings } from '@/generated/prisma/client'

export type { Prospect, Transcript, Summary, AppSettings }

export interface CitedItem {
  text: string
  source: string
}

export interface SummaryData {
  keyTopics: CitedItem[]
  actionItems: CitedItem[]
  decisions: CitedItem[]
  nextSteps: CitedItem[]
}

export interface ProspectWithRelations extends Prospect {
  transcripts: Transcript[]
  summaries: Summary[]
}

export interface TranscriptInput {
  filename: string
  text: string
}
