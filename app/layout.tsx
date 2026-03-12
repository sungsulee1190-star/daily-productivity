import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: '데일리 — 일상 생산성 앱',
  description: '투두, 루틴, 칸반, 캘린더를 하나로',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '데일리',
  },
}

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg)' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
