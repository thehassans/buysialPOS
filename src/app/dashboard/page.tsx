'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { UserRole } from '@/lib/types'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const { loginAs, currentUser } = useAppStore()

  useEffect(() => {
    const role = searchParams.get('role') as UserRole | null
    if (role) {
      loginAs(role)
    } else if (!currentUser) {
      loginAs('admin')
    }
  }, [searchParams])

  return <DashboardShell />
}
