'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  )
}
