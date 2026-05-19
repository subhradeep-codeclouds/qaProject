import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Subhradeep QA Management',
  description: 'QA Management Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1e1b4b',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: '0 8px 30px rgba(139,92,246,0.12)',
            },
          }}
        />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}
