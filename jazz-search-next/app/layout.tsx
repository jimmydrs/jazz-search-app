import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jazz Search App',
  description: 'Search for jazz music across platforms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
} 