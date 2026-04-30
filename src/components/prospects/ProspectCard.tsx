import Link from 'next/link'

interface Props {
  prospect: {
    id: string
    name: string
    company: string
    createdAt: Date
    _count: { transcripts: number; summaries: number }
  }
}

export function ProspectCard({ prospect }: Props) {
  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div>
        <p className="font-semibold text-gray-900">{prospect.name}</p>
        <p className="text-sm text-gray-500">{prospect.company}</p>
      </div>
      <div className="flex gap-4 text-xs text-gray-400">
        <span>{prospect._count.transcripts} transcript{prospect._count.transcripts !== 1 ? 's' : ''}</span>
        <span>{prospect._count.summaries} summar{prospect._count.summaries !== 1 ? 'ies' : 'y'}</span>
      </div>
    </Link>
  )
}
