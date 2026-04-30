import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/ui/NavBar'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Transcript Reader',
  description: 'AI-powered call transcript summarization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans" suppressHydrationWarning>
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
