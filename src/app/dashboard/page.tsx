'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { UserRole } from '@/lib/types'
import DashboardShell from '@/components/dashboard/DashboardShell'

function DashboardLoader() {
  const searchParams = useSearchParams()
  const { loginAs, currentUser } = useAppStore()

  useEffect(() => {
    const role = searchParams.get('role') as UserRole | null
    if (role && !currentUser) {
      loginAs(role)
    }
  }, [searchParams, currentUser, loginAs])

  return <DashboardShell />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-emerald-600 text-sm animate-pulse">Loading...</div>
      </div>
    }>
      <DashboardLoader />
    </Suspense>
  )
}
