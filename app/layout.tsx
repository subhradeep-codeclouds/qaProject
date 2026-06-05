import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QADesk',
  description: 'QA Team Workspace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#fffbeb',
                color: '#1c1a14',
                border: '1.5px solid rgba(217,119,6,0.30)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 8px 30px rgba(217,119,6,0.15)',
              },
            }}
          />
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
