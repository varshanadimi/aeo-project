import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AEO Diagnostic — AI Visibility Report',
  description: 'See how your brand ranks across ChatGPT, Claude, and Gemini. Get a competitive report card and actionable insights.',
  openGraph: {
    title: 'AEO Diagnostic',
    description: 'How does AI rank your product?',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
