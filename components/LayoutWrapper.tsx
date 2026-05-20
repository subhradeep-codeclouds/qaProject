'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-[#071b3c] dark:via-[#0c2040] dark:to-[#071b3c]">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  )
}
