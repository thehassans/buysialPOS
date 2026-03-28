'use client'

import { useAppStore } from '@/store/app-store'
import {
  LayoutDashboard, ShoppingCart, ChefHat, Package, Users,
  QrCode, Settings, BarChart3, Building2, LogOut, ChevronLeft,
  ChevronRight, Receipt, UtensilsCrossed, CreditCard, Table2, ClipboardList
} from 'lucide-react'
import { cn, getInitials, getReadableTextColor, mixHexColors, normalizeHexColor, ROLE_LABELS, withAlpha } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import TenantBrandMark from '@/components/shared/TenantBrandMark'

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
    { id: 'orders', label: 'Orders', labelAr: 'الطلبات', icon: ClipboardList },
    { id: 'tables', label: 'Tables', labelAr: 'الطاولات', icon: Table2 },
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
    { id: 'orders', label: 'Orders', labelAr: 'الطلبات', icon: ClipboardList },
    { id: 'tables', label: 'Tables', labelAr: 'الطاولات', icon: Table2 },
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
    { id: 'pos', label: 'New Order', labelAr: 'طلب جديد', icon: ShoppingCart },
    { id: 'my-orders', label: 'Orders', labelAr: 'الطلبات', icon: Receipt },
    { id: 'cashier', label: 'Payments', labelAr: 'المدفوعات', icon: CreditCard },
    { id: 'kds', label: 'Kitchen Display', labelAr: 'شاشة المطبخ', icon: ChefHat },
    { id: 'reports', label: 'Reports', labelAr: 'التقارير', icon: BarChart3 },
  ],
}

export default function Sidebar() {
  const { currentUser, currentTenant, activeView, setActiveView, sidebarOpen, toggleSidebar, logout, language } = useAppStore()
  const router = useRouter()
  if (!currentUser) return null

  const isAr = language === 'ar'
  const items = NAV_ITEMS[currentUser.role] || NAV_ITEMS.admin
  const primaryColor = normalizeHexColor(currentTenant?.primaryColor)
  const navigationColor = normalizeHexColor(currentTenant?.secondaryColor || mixHexColors(primaryColor, '#1e293b', 0.3), '#0f766e')
  const sidebarSurface = mixHexColors(navigationColor, '#0f172a', 0.32)
  const sidebarTextColor = getReadableTextColor(mixHexColors(navigationColor, '#ffffff', 0.1))
  const mutedSidebarText = sidebarTextColor === '#ffffff' ? withAlpha('#ffffff', 0.72) : withAlpha('#0f172a', 0.68)
  const handleNavClick = (view: string) => {
    setActiveView(view)
    if (typeof window !== 'undefined' && window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-900/60 backdrop-blur-sm md:hidden" 
          onClick={toggleSidebar} 
        />
      )}
      
      <aside className={cn(
        'flex flex-col transition-all duration-300 z-40 shadow-2xl h-screen backdrop-blur-xl overflow-hidden',
        isAr ? 'md:border-l' : 'md:border-r',
        'fixed md:relative inset-y-0',
        sidebarOpen 
          ? 'translate-x-0 w-[82vw] max-w-72 md:w-60' 
          : isAr 
            ? 'translate-x-full md:translate-x-0 md:w-16' 
            : '-translate-x-full md:translate-x-0 md:w-16'
      )}
      style={{
        background: `linear-gradient(180deg, ${mixHexColors(navigationColor, '#ffffff', 0.08)} 0%, ${sidebarSurface} 60%, ${mixHexColors(sidebarSurface, '#0f172a', 0.15)} 100%)`,
        borderColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.12 : 0.3),
      }}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b h-16" style={{ borderColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.12 : 0.28) }}>
        <TenantBrandMark
          logo={currentTenant?.logo}
          name={currentTenant?.name || 'Buysial ERP'}
          className="w-8 h-8 rounded-lg flex-shrink-0"
          initialsClassName="text-[10px]"
        />
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm truncate" style={{ color: sidebarTextColor }}>Buysial ERP</div>
            <div className="text-xs truncate" style={{ color: mutedSidebarText }}>{currentTenant?.name}</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
              activeView === item.id ? 'border shadow-lg' : 'border border-transparent'
            )}
            style={activeView === item.id
              ? {
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${mixHexColors(primaryColor, navigationColor, 0.42)} 100%)`,
                  color: getReadableTextColor(mixHexColors(primaryColor, navigationColor, 0.42)),
                  borderColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.12 : 0.16),
                }
              : {
                  color: mutedSidebarText,
                  backgroundColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.04 : 0.46),
                }}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: activeView === item.id ? getReadableTextColor(mixHexColors(primaryColor, navigationColor, 0.42)) : mutedSidebarText }} />
            {sidebarOpen && <span className="truncate">{isAr ? item.labelAr : item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t" style={{ borderColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.12 : 0.28) }}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer group" style={{ backgroundColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.08 : 0.42) }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.14 : 0.74), color: sidebarTextColor }}>
              {getInitials(currentUser.name)}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-medium truncate" style={{ color: sidebarTextColor }}>{currentUser.name}</div>
              <div className="text-xs" style={{ color: mutedSidebarText }}>{ROLE_LABELS[currentUser.role]}</div>
            </div>
            <button onClick={() => { logout(); router.push('/login') }} className="transition-colors" style={{ color: mutedSidebarText }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.14 : 0.7), color: sidebarTextColor }}>
              {getInitials(currentUser.name)}
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'hidden md:flex absolute top-20 w-6 h-6 rounded-full shadow items-center justify-center z-30 backdrop-blur-xl',
          isAr ? '-left-3' : '-right-3'
        )}
        style={{ backgroundColor: withAlpha('#ffffff', sidebarTextColor === '#ffffff' ? 0.9 : 0.92), color: navigationColor, border: `1px solid ${withAlpha(navigationColor, 0.18)}` }}
      >
        {isAr
          ? (sidebarOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />)
          : (sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
        }
      </button>
    </aside>
    </>
  )
}
