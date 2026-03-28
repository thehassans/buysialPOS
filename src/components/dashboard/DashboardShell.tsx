'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import TablesModule from '../modules/TablesModule'
import OrdersModule from '../modules/OrdersModule'
import BranchesModule from '../modules/BranchesModule'

export default function DashboardShell() {
  const { currentUser, currentTenant, activeView, sidebarOpen, language, initPlatformData, initFromDB } = useAppStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.replace('/login')
    }
  }, [mounted, currentUser])

  useEffect(() => {
    if (!currentUser) return
    initPlatformData()
    if (currentTenant) {
      initFromDB()
    }
  }, [currentUser?.id, currentTenant?.id, initPlatformData, initFromDB])

  useEffect(() => {
    if (!currentUser || !currentTenant || currentUser.role === 'super_admin') return
    const interval = setInterval(() => {
      initFromDB()
    }, 7000)
    return () => clearInterval(interval)
  }, [currentUser?.id, currentUser?.role, currentTenant?.id, initFromDB])

  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-emerald-600 text-sm animate-pulse">Loading...</div>
    </div>
  )
  if (!currentUser) return null

  const isRTL = language === 'ar'
  const role = currentUser.role

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (role === 'super_admin') return <SuperAdminDashboard />
        return <AdminDashboard />
      case 'pos':
        return <POSInterface />
      case 'cashier':
        return <CashierInterface />
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
      case 'tables':
        return <TablesModule />
      case 'orders':
        return <OrdersModule />
      case 'branches':
        return <BranchesModule />
      default:
        if (role === 'super_admin') return <SuperAdminDashboard />
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-row overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-auto p-3 sm:p-6 scrollbar-thin bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
