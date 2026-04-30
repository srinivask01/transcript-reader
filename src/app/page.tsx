import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProspectCard } from '@/components/prospects/ProspectCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const prospects = await prisma.prospect.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { transcripts: true, summaries: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-sm text-gray-500 mt-1">
            {prospects.length} prospect{prospects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/prospects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Prospect
        </Link>
      </div>

      {prospects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No prospects yet.</p>
          <p className="text-sm mt-1">Create your first prospect to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} />
          ))}
        </div>
      )}
    </div>
  )
}
