'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Bell, Globe, ArrowLeft, ArrowRight, LogOut, Cloud, CloudOff, RefreshCw, Menu } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS, cn, getReadableTextColor, mixHexColors, normalizeHexColor, withAlpha } from '@/lib/utils'
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
  const primaryColor = normalizeHexColor(currentTenant.primaryColor)
  const secondaryColor = normalizeHexColor(currentTenant.secondaryColor || mixHexColors(primaryColor, '#0f172a', 0.35))
  const headerTone = mixHexColors(primaryColor, secondaryColor, 0.22)
  const headerDepthTone = mixHexColors(primaryColor, '#0f172a', 0.18)
  const headerTextColor = getReadableTextColor(headerTone)
  const mutedTextColor = headerTextColor === '#ffffff' ? withAlpha('#ffffff', 0.76) : withAlpha('#0f172a', 0.68)
  const glassBackground = headerTextColor === '#ffffff' ? withAlpha('#ffffff', 0.14) : withAlpha('#ffffff', 0.72)
  const glassBorder = headerTextColor === '#ffffff' ? withAlpha('#ffffff', 0.18) : withAlpha(primaryColor, 0.18)
  const iconButtonStyle = {
    color: headerTextColor,
    backgroundColor: glassBackground,
    borderColor: glassBorder,
  }
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
    <header
      className="min-h-16 flex flex-wrap items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-2 flex-shrink-0 shadow-[0_18px_60px_rgba(15,23,42,0.12)] border-b"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${headerTone} 52%, ${headerDepthTone} 100%)`,
        borderColor: withAlpha('#ffffff', headerTextColor === '#ffffff' ? 0.12 : 0.4),
      }}
    >
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <button onClick={toggleSidebar} className="md:hidden p-1.5 -ml-2 rounded-lg transition-colors border" style={iconButtonStyle}>
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => router.push('/')} className="hidden md:block transition-colors" style={{ color: mutedTextColor }}>
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <TenantBrandMark
          logo={currentTenant.logo}
          name={currentTenant.name}
          className="hidden sm:flex w-10 h-10 rounded-2xl flex-shrink-0"
          imageClassName="drop-shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
          initialsClassName="text-xs"
        />
        <div className="min-w-0">
          <h1 className="font-bold text-sm md:text-base truncate max-w-[120px] sm:max-w-xs" style={{ color: headerTextColor }}>{VIEW_LABELS[activeView] || 'Dashboard'}</h1>
          <div className="flex items-center gap-2 text-xs" style={{ color: mutedTextColor }}>
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
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shadow-sm backdrop-blur-xl",
            !isOnline
              ? "bg-red-500/15 text-white border-white/10 cursor-not-allowed"
              : isSyncing
                ? "bg-blue-500/20 text-white border-white/10 cursor-wait"
                : pendingCount > 0
                  ? "bg-white/18 text-white border-white/15 hover:bg-white/24"
                  : "bg-white/14 text-white border-white/15 hover:bg-white/20"
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border"
          style={iconButtonStyle}
        >
          <Globe className="w-3.5 h-3.5" />
          {isAr ? 'EN' : 'عربي'}
        </button>

        <div className="relative hidden sm:block">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors border" style={iconButtonStyle}>
            <Bell className="w-4 h-4" />
          </button>
          <div className={cn('absolute -top-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold', isAr ? '-left-1' : '-right-1')}>3</div>
        </div>

        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border min-w-0 backdrop-blur-xl" style={iconButtonStyle}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: withAlpha('#ffffff', headerTextColor === '#ffffff' ? 0.14 : 0.58), color: headerTextColor }}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-medium" style={{ color: headerTextColor }}>{currentUser.name.split(' ')[0]}</div>
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
