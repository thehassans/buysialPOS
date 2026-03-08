'use client'

import { useAppStore } from '@/store/app-store'
import Image from 'next/image'
import {
  LayoutDashboard, ShoppingCart, ChefHat, Package, Users,
  QrCode, Settings, BarChart3, Building2, LogOut, ChevronLeft,
  ChevronRight, Receipt, UtensilsCrossed
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = {
  super_admin: [
    { id: 'dashboard', label: 'Overview', labelAr: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'tenants', label: 'Tenants', labelAr: 'المطاعم', icon: Building2 },
    { id: 'reports', label: 'Analytics', labelAr: 'التحليلات', icon: BarChart3 },
    { id: 'settings', label: 'Settings', labelAr: 'الإعدادات', icon: Settings },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', labelAr: 'نقطة البيع', icon: ShoppingCart },
    { id: 'menu-management', label: 'Menu', labelAr: 'إدارة القائمة', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Inventory', labelAr: 'المخزون', icon: Package },
    { id: 'hr', label: 'HR & Payroll', labelAr: 'الموارد البشرية', icon: Users },
    { id: 'qr-menu', label: 'QR Menu', labelAr: 'قائمة QR', icon: QrCode },
    { id: 'reports', label: 'Reports', labelAr: 'التقارير', icon: BarChart3 },
    { id: 'settings', label: 'Settings', labelAr: 'الإعدادات', icon: Settings },
  ],
  manager: [
    { id: 'dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', labelAr: 'نقطة البيع', icon: ShoppingCart },
    { id: 'menu-management', label: 'Menu', labelAr: 'إدارة القائمة', icon: UtensilsCrossed },
    { id: 'inventory', label: 'Inventory', labelAr: 'المخزون', icon: Package },
    { id: 'hr', label: 'Attendance', labelAr: 'الحضور', icon: Users },
    { id: 'reports', label: 'Reports', labelAr: 'التقارير', icon: BarChart3 },
  ],
  waiter: [
    { id: 'pos', label: 'New Order', labelAr: 'طلب جديد', icon: ShoppingCart },
    { id: 'my-orders', label: 'My Orders', labelAr: 'طلباتي', icon: Receipt },
  ],
  chef: [
    { id: 'kds', label: 'Kitchen Display', labelAr: 'شاشة المطبخ', icon: ChefHat },
  ],
  cashier: [
    { id: 'pos', label: 'Checkout', labelAr: 'الدفع', icon: Receipt },
    { id: 'reports', label: 'Reports', labelAr: 'التقارير', icon: BarChart3 },
  ],
}

export default function Sidebar() {
  const { currentUser, currentTenant, activeView, setActiveView, sidebarOpen, toggleSidebar, logout, language } = useAppStore()
  const router = useRouter()
  if (!currentUser) return null

  const isAr = language === 'ar'
  const items = NAV_ITEMS[currentUser.role] || NAV_ITEMS.admin

  return (
    <aside className={cn(
      'flex flex-col bg-white transition-all duration-300 relative z-20 shadow-sm',
      isAr ? 'border-l border-gray-200' : 'border-r border-gray-200',
      sidebarOpen ? 'w-60' : 'w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 h-16">
        <Image src="/logo.png" alt="BuysialPOS" width={32} height={32} className="rounded-lg object-contain flex-shrink-0" />
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-bold text-gray-900 text-sm truncate">Buysial ERP</div>
            <div className="text-slate-500 text-xs truncate">{currentTenant?.name}</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
              activeView === item.id
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-500 hover:bg-gray-50 hover:text-gray-800'
            )}
          >
            <item.icon className={cn('w-4 h-4 flex-shrink-0', activeView === item.id ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600')} />
            {sidebarOpen && <span className="truncate">{isAr ? item.labelAr : item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-100">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
              {getInitials(currentUser.name)}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-gray-900 text-xs font-medium truncate">{currentUser.name}</div>
              <div className="text-slate-500 text-xs">{ROLE_LABELS[currentUser.role]}</div>
            </div>
            <button onClick={() => { logout(); router.push('/login') }} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
              {getInitials(currentUser.name)}
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute top-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-slate-500 hover:text-emerald-600 z-30',
          isAr ? '-left-3' : '-right-3'
        )}
      >
        {isAr
          ? (sidebarOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />)
          : (sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
        }
      </button>
    </aside>
  )
}
