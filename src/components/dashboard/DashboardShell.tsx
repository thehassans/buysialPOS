'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import SuperAdminDashboard from './SuperAdminDashboard'
import AdminDashboard from './AdminDashboard'
import POSInterface from '../pos/POSInterface'
import KitchenDisplay from '../kds/KitchenDisplay'
import CashierInterface from '../pos/CashierInterface'
import InventoryModule from '../modules/InventoryModule'
import HRModule from '../modules/HRModule'
import QRMenuModule from '../qr/QRMenuModule'
import SettingsModule from '../modules/SettingsModule'
import ReportsModule from '../modules/ReportsModule'
import TenantsModule from '../modules/TenantsModule'
import WaiterOrders from '../pos/WaiterOrders'
import MenuManagementModule from '../modules/MenuManagementModule'

export default function DashboardShell() {
  const { currentUser, activeView, sidebarOpen, language } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !currentUser) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-emerald-600 text-sm animate-pulse">Loading...</div>
    </div>
  )

  const isRTL = language === 'ar'
  const role = currentUser.role

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (role === 'super_admin') return <SuperAdminDashboard />
        return <AdminDashboard />
      case 'pos':
        if (role === 'waiter') return <POSInterface />
        if (role === 'cashier') return <CashierInterface />
        return <POSInterface />
      case 'my-orders':
        return <WaiterOrders />
      case 'menu-management':
        return <MenuManagementModule />
      case 'kds':
        return <KitchenDisplay />
      case 'inventory':
        return <InventoryModule />
      case 'hr':
        return <HRModule />
      case 'qr-menu':
        return <QRMenuModule />
      case 'settings':
        return <SettingsModule />
      case 'reports':
        return <ReportsModule />
      case 'tenants':
        return <TenantsModule />
      default:
        if (role === 'super_admin') return <SuperAdminDashboard />
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-row" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 scrollbar-thin bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
