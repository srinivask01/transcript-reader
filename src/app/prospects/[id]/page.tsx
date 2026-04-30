import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TranscriptUpload } from '@/components/transcripts/TranscriptUpload'
import { TranscriptList } from '@/components/transcripts/TranscriptList'
import { SummaryList } from '@/components/summaries/SummaryList'
import { GenerateSummaryButton } from '@/components/summaries/GenerateSummaryButton'
import { DeleteProspectButton } from '@/components/prospects/DeleteProspectButton'

export const dynamic = 'force-dynamic'

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      transcripts: { orderBy: { uploadedAt: 'desc' } },
      summaries: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!prospect) notFound()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{prospect.name}</h1>
          <p className="text-gray-500 mt-1">{prospect.company}</p>
        </div>
        <DeleteProspectButton prospectId={prospect.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Transcripts</h2>
          <TranscriptUpload prospectId={prospect.id} />
          <TranscriptList transcripts={prospect.transcripts} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Summaries</h2>
            <GenerateSummaryButton
              prospectId={prospect.id}
              hasTranscripts={prospect.transcripts.length > 0}
            />
          </div>
          <SummaryList summaries={prospect.summaries} />
        </div>
      </div>
    </div>
  )
}
