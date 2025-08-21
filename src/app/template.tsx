'use client'

import { usePathname } from 'next/navigation'
import AppLayout from '@/components/app-layout'

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Pages that should not have the sidebar layout
  const excludedPaths = ['/auth', '/setup']
  const isExcluded = excludedPaths.some(path => pathname.startsWith(path))
  
  if (isExcluded) {
    return <>{children}</>
  }
  
  return <AppLayout>{children}</AppLayout>
}