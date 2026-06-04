'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const AUTH_PAGES = ['/login', '/register', '/verify-email']

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (AUTH_PAGES.includes(pathname)) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-50 to-sky-100 dark:from-[#071b3c] dark:via-[#0c2040] dark:to-[#071b3c]">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  )
}
