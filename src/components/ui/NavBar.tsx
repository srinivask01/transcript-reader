import Link from 'next/link'

export function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight">
          Transcript Reader
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            Prospects
          </Link>
          <Link href="/settings" className="text-gray-600 hover:text-gray-900 transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </nav>
  )
}
