'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Bell, Globe, ArrowLeft, ArrowRight, LogOut, Cloud, CloudOff, RefreshCw, Menu } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { getCountryConfig } from '@/lib/country-config'
import { processQueue, getPendingCount } from '@/lib/sync-queue'
import TenantBrandMark from '@/components/shared/TenantBrandMark'

export default function TopBar() {
  const { currentUser, currentTenant, language, setLanguage, activeView, logout, toggleSidebar } = useAppStore()
  const router = useRouter()
  
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  useEffect(() => {
    const refreshPending = () => setPendingCount(getPendingCount())
    const syncIfNeeded = async () => {
      if (!navigator.onLine || getPendingCount() === 0) return
      setIsSyncing(true)
      const synced = await processQueue()
      setIsSyncing(false)
      refreshPending()
      if (synced > 0) setLastSynced(new Date())
    }

    setIsOnline(navigator.onLine)
    refreshPending()
    syncIfNeeded()

    const handleOnline = async () => {
      setIsOnline(true)
      await syncIfNeeded()
    }
    const handleOffline = () => setIsOnline(false)
    const handleQueueChange = () => refreshPending()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('sync-queue-changed', handleQueueChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('sync-queue-changed', handleQueueChange)
    }
  }, [])

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return
    setIsSyncing(true)
    const synced = await processQueue()
    setIsSyncing(false)
    setPendingCount(getPendingCount())
    if (synced > 0) setLastSynced(new Date())
  }

  if (!currentUser || !currentTenant) return null

  const countryConfig = getCountryConfig(currentTenant.countryCode)
  const isAr = language === 'ar'
  const VIEW_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Point of Sale',
    cashier: 'Payments',
    kds: 'Kitchen Display System',
    inventory: 'Inventory Management',
    hr: 'HR & Attendance',
    'qr-menu': 'QR Menu Generator',
    settings: 'Settings',
    reports: 'Analytics & Reports',
    tenants: 'Tenant Management',
  }

  return (
    <header className="min-h-16 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-2 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <button onClick={toggleSidebar} className="md:hidden p-1.5 -ml-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => router.push('/')} className="hidden md:block text-slate-400 hover:text-emerald-600 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <TenantBrandMark
          logo={currentTenant.logo}
          name={currentTenant.name}
          className="hidden sm:flex w-9 h-9 rounded-xl flex-shrink-0"
          initialsClassName="text-xs"
        />
        <div className="min-w-0">
          <h1 className="text-gray-900 font-bold text-sm md:text-base truncate max-w-[120px] sm:max-w-xs">{VIEW_LABELS[activeView] || 'Dashboard'}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate max-w-[80px] sm:max-w-[150px]">{currentTenant.name}</span>
            <span>·</span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <span>
                {currentTenant.countryCode === 'KSA' ? '🇸🇦' : currentTenant.countryCode === 'UAE' ? '🇦🇪' : '🇴🇲'}
                <span className="hidden sm:inline">{' '}{countryConfig.complianceLabel}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap justify-end gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Sync Status Button */}
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm",
            !isOnline
              ? "bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
              : isSyncing
                ? "bg-blue-50 text-blue-700 border-blue-200 cursor-wait"
                : pendingCount > 0
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          )}
          title={!isOnline ? 'Offline — changes queued locally' : lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : 'Sync with cloud'}
        >
          {!isOnline ? <CloudOff className="w-3.5 h-3.5" /> : isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">
            {!isOnline ? 'Offline' : isSyncing ? 'Syncing…' : pendingCount > 0 ? `${pendingCount} pending` : 'Online'}
          </span>
          {pendingCount > 0 && isOnline && !isSyncing && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 transition-all border border-gray-200 hover:border-emerald-300"
        >
          <Globe className="w-3.5 h-3.5" />
          {isAr ? 'EN' : 'عربي'}
        </button>

        <div className="relative hidden sm:block">
          <button className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 transition-colors border border-gray-200">
            <Bell className="w-4 h-4" />
          </button>
          <div className={cn('absolute -top-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold', isAr ? '-left-1' : '-right-1')}>3</div>
        </div>

        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-medium text-gray-900">{currentUser.name.split(' ')[0]}</div>
          </div>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', ROLE_COLORS[currentUser.role])}>
            {ROLE_LABELS[currentUser.role]}
          </span>
        </div>

        <button
          onClick={() => { logout(); router.push('/login') }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 transition-all"
          title="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
