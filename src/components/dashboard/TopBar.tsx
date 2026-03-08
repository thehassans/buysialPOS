'use client'

import { useAppStore } from '@/store/app-store'
import { Bell, Globe, ChefHat, ArrowLeft, ArrowRight, LogOut } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { getCountryConfig } from '@/lib/country-config'

export default function TopBar() {
  const { currentUser, currentTenant, language, setLanguage, activeView, logout } = useAppStore()
  const router = useRouter()
  if (!currentUser || !currentTenant) return null

  const countryConfig = getCountryConfig(currentTenant.countryCode)
  const isAr = language === 'ar'
  const VIEW_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: currentUser.role === 'cashier' ? 'Checkout' : 'Point of Sale',
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
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/')} className="text-slate-400 hover:text-emerald-600 transition-colors">
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
        <div>
          <h1 className="text-gray-900 font-semibold text-sm">{VIEW_LABELS[activeView] || 'Dashboard'}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{currentTenant.name}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span>
                {currentTenant.countryCode === 'KSA' ? '🇸🇦' : currentTenant.countryCode === 'UAE' ? '🇦🇪' : '🇴🇲'}
                {' '}{countryConfig.complianceLabel}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
