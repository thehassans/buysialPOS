'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Bell, Globe, ChefHat, ArrowLeft, ArrowRight, LogOut, Cloud, CloudOff, RefreshCw, Menu } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { getCountryConfig } from '@/lib/country-config'

export default function TopBar() {
  const { currentUser, currentTenant, language, setLanguage, activeView, logout, toggleSidebar } = useAppStore()
  const router = useRouter()
  
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleManualSync = async () => {
    if (!isOnline) return
    setIsSyncing(true)
    try {
      const res = await fetch('/api/sync/trigger', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      setLastSynced(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setIsSyncing(false)
    }
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={toggleSidebar} className="md:hidden p-1.5 -ml-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => router.push('/')} className="hidden md:block text-slate-400 hover:text-emerald-600 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <div>
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

      <div className="flex items-center gap-3">
        {/* Sync Status Button */}
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-sm",
            isOnline 
              ? isSyncing 
                ? "bg-blue-50 text-blue-700 border-blue-200 cursor-wait"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
          )}
          title={isOnline ? (lastSynced ? `Last synced: ${lastSynced.toLocaleTimeString()}` : "Sync with Cloud") : "Offline - Check Connection"}
        >
          {isOnline ? (
            isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />
          ) : (
            <CloudOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : 'Online'}
          </span>
        </button>
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 transition-all border border-gray-200 hover:border-emerald-300"
        >
          <Globe className="w-3.5 h-3.5" />
          {isAr ? 'EN' : 'عربي'}
        </button>

        <div className="relative">
          <button className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 transition-colors border border-gray-200">
            <Bell className="w-4 h-4" />
          </button>
          <div className={cn('absolute -top-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold', isAr ? '-left-1' : '-right-1')}>3</div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-[10px] font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
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
