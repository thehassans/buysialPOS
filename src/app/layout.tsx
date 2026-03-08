import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Buysial ERP – Premium Restaurant POS & Management System',
  description: 'Multi-tenant SaaS Restaurant POS System with ZATCA/FTA compliance for KSA & UAE',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-surface-dark text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
