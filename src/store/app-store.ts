import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Tenant, Order, OrderItem, MenuItem, Table, Theme, Language, InventoryItem, AttendanceRecord, Category } from '@/lib/types'
import { MOCK_USERS, MOCK_TENANTS, MOCK_ORDERS, MOCK_MENU_ITEMS, MOCK_TABLES, MOCK_INVENTORY, MOCK_ATTENDANCE, MOCK_CATEGORIES } from '@/lib/mock-data'
import { apiSync } from '@/lib/sync-queue'

interface AppState {
  currentUser: User | null
  currentTenant: Tenant | null
  tenants: Tenant[]
  theme: Theme
  language: Language
  orders: Order[]
  users: User[]
  categories: Category[]
  menuItems: MenuItem[]
  tables: Table[]
  inventoryItems: InventoryItem[]
  attendance: AttendanceRecord[]
  activeView: string
  sidebarOpen: boolean
  editingOrder: Order | null

  setCurrentUser: (user: User | null) => void
  setCurrentTenant: (tenant: Tenant | null) => void
  setTheme: (theme: Theme) => void
  setLanguage: (lang: Language) => void
  setActiveView: (view: string) => void
  toggleSidebar: () => void
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  addTenant: (tenant: Tenant) => void
  updateTenant: (id: string, updates: Partial<Tenant>) => void
  addCategory: (category: Category) => void
  setEditingOrder: (order: Order | null) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  addInventoryItem: (item: InventoryItem) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (id: string) => void
  toggleAttendance: (userId: string) => void
  reserveTable: (tableNumber: number, orderId: string) => void
  releaseTable: (tableNumber: number) => void
  initPlatformData: () => Promise<void>
  initFromDB: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentTenant: null,
      tenants: MOCK_TENANTS,
      theme: 'light',
      language: 'en',
      orders: MOCK_ORDERS,
      users: MOCK_USERS,
      categories: MOCK_CATEGORIES,
      menuItems: MOCK_MENU_ITEMS,
      tables: MOCK_TABLES,
      inventoryItems: MOCK_INVENTORY,
      attendance: MOCK_ATTENDANCE,
      activeView: 'dashboard',
      sidebarOpen: false,
      editingOrder: null,

      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setActiveView: (activeView) => set({ activeView }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      login: (email, password) => {
        const allUsers = get().users
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
        if (!user) return { success: false, error: 'No account found with this email' }
        if (user.role === 'super_admin') return { success: false, error: 'Use platform credentials to access the super admin panel' }
        const fallbackPassword = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())?.password
        const resolvedPassword = user.password || fallbackPassword
        if (!resolvedPassword || resolvedPassword !== password) return { success: false, error: 'Incorrect password' }
        if (!user.isActive) return { success: false, error: 'Account is deactivated. Contact your admin.' }
        const tenants = get().tenants
        const tenant = tenants.find(t => t.id === user.tenantId)
        if (!tenant) return { success: false, error: 'Tenant not found. Contact platform support.' }
        const defaultView: Record<string, string> = {
          super_admin: 'dashboard', admin: 'dashboard', manager: 'dashboard',
          waiter: 'pos', chef: 'kds', cashier: 'cashier',
        }
        set({ currentUser: user, currentTenant: tenant, language: user.language || 'en', activeView: defaultView[user.role] || 'dashboard' })
        return { success: true }
      },

      logout: () => set({ currentUser: null, currentTenant: null }),

      addTenant: (tenant) => {
        set((state) => ({ tenants: [...state.tenants.filter(existing => existing.id !== tenant.id), tenant] }))
        apiSync('/api/tenants', 'POST', tenant)
      },
      updateTenant: (id, updates) => {
        set((state) => ({ tenants: state.tenants.map(t => t.id === id ? { ...t, ...updates } : t) }))
        apiSync(`/api/tenants/${id}`, 'PATCH', updates)
      },
      addCategory: (category) => {
        set((state) => ({ categories: [...state.categories.filter(existing => existing.id !== category.id), category] }))
        apiSync('/api/categories', 'POST', category)
      },

      setEditingOrder: (order) => set({ editingOrder: order }),

      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }))
        apiSync('/api/orders', 'POST', order)
      },

      updateOrder: (id, updates) => {
        set((state) => ({ orders: state.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o) }))
        apiSync(`/api/orders/${id}`, 'PATCH', updates)
      },

      updateOrderItemStatus: (orderId, itemId, status) => {
        const currentItems = get().orders.find(o => o.id === orderId)?.items
        const updatedItems = currentItems?.map(i => i.id === itemId ? { ...i, status } : i)
        set((state) => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, status } : i), updatedAt: new Date() }
              : o
          )
        }))
        if (updatedItems) apiSync(`/api/orders/${orderId}`, 'PATCH', { items: updatedItems })
      },

      addUser: (user) => {
        set((state) => ({ users: [...state.users, user] }))
        apiSync('/api/users', 'POST', user)
      },
      updateUser: (id, updates) => {
        set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, ...updates } : u) }))
        apiSync(`/api/users/${id}`, 'PATCH', updates)
      },
      deleteUser: (id) => {
        set((state) => ({ users: state.users.filter(u => u.id !== id) }))
        apiSync(`/api/users/${id}`, 'DELETE')
      },

      addMenuItem: (item) => {
        set((state) => ({ menuItems: [...state.menuItems, item] }))
        apiSync('/api/menu-items', 'POST', item)
      },
      updateMenuItem: (id, updates) => {
        set((state) => ({ menuItems: state.menuItems.map(m => m.id === id ? { ...m, ...updates } : m) }))
        apiSync(`/api/menu-items/${id}`, 'PATCH', updates)
      },
      deleteMenuItem: (id) => {
        set((state) => ({ menuItems: state.menuItems.filter(m => m.id !== id) }))
        apiSync(`/api/menu-items/${id}`, 'DELETE')
      },

      addInventoryItem: (item) => {
        set((state) => ({ inventoryItems: [...state.inventoryItems, item] }))
      },
      updateInventoryItem: (id, updates) => {
        set((state) => ({ inventoryItems: state.inventoryItems.map(item => item.id === id ? { ...item, ...updates } : item) }))
      },
      deleteInventoryItem: (id) => {
        set((state) => ({ inventoryItems: state.inventoryItems.filter(item => item.id !== id) }))
      },
      toggleAttendance: (userId) => {
        const tenantId = get().currentTenant?.id
        if (!tenantId) return
        const now = new Date()
        const date = now.toISOString().split('T')[0]
        set((state) => {
          const activeRecord = state.attendance.find(record => record.tenantId === tenantId && record.userId === userId && record.date === date && !record.clockOut)
          if (activeRecord) {
            return {
              attendance: state.attendance.map(record =>
                record.id === activeRecord.id
                  ? {
                      ...record,
                      clockOut: now,
                      hoursWorked: Number(((now.getTime() - new Date(record.clockIn).getTime()) / 3600000).toFixed(2)),
                    }
                  : record
              ),
            }
          }
          return {
            attendance: [
              ...state.attendance,
              {
                id: `att-${Date.now()}`,
                tenantId,
                userId,
                clockIn: now,
                date,
              },
            ],
          }
        })
      },

      reserveTable: (tableNumber, orderId) => set((state) => ({
        tables: state.tables.map(t =>
          t.number === tableNumber ? { ...t, isOccupied: true, currentOrderId: orderId } : t
        )
      })),

      releaseTable: (tableNumber) => set((state) => ({
        tables: state.tables.map(t =>
          t.number === tableNumber ? { ...t, isOccupied: false, currentOrderId: undefined } : t
        )
      })),

      initPlatformData: async () => {
        try {
          const existingUsers = get().users
          const existingTenants = get().tenants
          const existingCurrentTenant = get().currentTenant
          const [tenantsRes, usersRes] = await Promise.all([
            fetch('/api/tenants'),
            fetch('/api/users'),
          ])
          if (!tenantsRes.ok || !usersRes.ok) return
          const [tenants, users] = await Promise.all([
            tenantsRes.json(),
            usersRes.json(),
          ])
          const parsedTenants = tenants.map((tenant: Tenant) => ({
            ...tenant,
            createdAt: new Date(tenant.createdAt),
            validUntil: tenant.validUntil ? new Date(tenant.validUntil) : undefined,
          }))
          const parsedUsers = users.filter((u: any) => u.role !== 'super_admin').map((u: any) => {
            const localUser = existingUsers.find(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())
            return {
              ...localUser,
              ...u,
              createdAt: new Date(u.createdAt),
              password: u.password ?? localUser?.password,
            }
          })
          const mergedCurrentTenant = existingCurrentTenant
            ? parsedTenants.find((tenant: Tenant) => tenant.id === existingCurrentTenant.id) || existingCurrentTenant
            : existingCurrentTenant
          if (parsedTenants.length === 0 && existingTenants.length > 0) {
            existingTenants.forEach(tenant => apiSync('/api/tenants', 'POST', tenant))
          }
          if (parsedUsers.length === 0 && existingUsers.length > 0) {
            existingUsers.filter(user => user.role !== 'super_admin').forEach(user => apiSync('/api/users', 'POST', user))
          }
          set({
            currentTenant: mergedCurrentTenant,
            tenants: parsedTenants.length > 0 ? parsedTenants : existingTenants,
            users: parsedUsers.length > 0
              ? [...existingUsers.filter(user => !parsedUsers.some((parsedUser: User) => parsedUser.id === user.id)), ...parsedUsers]
              : existingUsers,
          })
        } catch (e) {
          console.error('initPlatformData failed (using localStorage):', e)
        }
      },

      initFromDB: async () => {
        try {
          const tenantId = get().currentTenant?.id
          if (!tenantId) return
          const existingUsers = get().users
          const existingOrders = get().orders
          const existingCategories = get().categories
          const existingMenuItems = get().menuItems
          const existingCurrentUser = get().currentUser
          const [ordersRes, menuRes, usersRes, categoriesRes] = await Promise.all([
            fetch(`/api/orders?tenantId=${tenantId}`),
            fetch(`/api/menu-items?tenantId=${tenantId}`),
            fetch(`/api/users?tenantId=${tenantId}`),
            fetch(`/api/categories?tenantId=${tenantId}`),
          ])
          if (!ordersRes.ok || !menuRes.ok || !usersRes.ok || !categoriesRes.ok) return
          const [orders, menuItems, users, categories] = await Promise.all([
            ordersRes.json(), menuRes.json(), usersRes.json(), categoriesRes.json(),
          ])
          const parsedOrders = orders.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt) }))
          const parsedUsers = users.filter((u: any) => u.role !== 'super_admin').map((u: any) => {
            const localUser = existingUsers.find(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())
            return {
              ...localUser,
              ...u,
              createdAt: new Date(u.createdAt),
              password: u.password ?? localUser?.password,
            }
          })
          const parsedMenuItems = menuItems.map((item: MenuItem) => {
            const localItem = existingMenuItems.find(existing => existing.id === item.id)
            return {
              ...localItem,
              ...item,
              hasHalfPlate: item.hasHalfPlate ?? localItem?.hasHalfPlate,
              halfPlatePrice: item.halfPlatePrice ?? localItem?.halfPlatePrice,
            }
          })
          const parsedCategories = categories.map((category: Category) => ({
            ...category,
            sortOrder: Number(category.sortOrder ?? 0),
          }))
          if (parsedOrders.length === 0) {
            existingOrders.filter(order => order.tenantId === tenantId).forEach(order => apiSync('/api/orders', 'POST', order))
          }
          if (parsedUsers.length === 0) {
            existingUsers.filter(user => user.tenantId === tenantId && user.role !== 'super_admin').forEach(user => apiSync('/api/users', 'POST', user))
          }
          if (parsedCategories.length === 0) {
            existingCategories.filter(category => category.tenantId === tenantId).forEach(category => apiSync('/api/categories', 'POST', category))
          }
          if (parsedMenuItems.length === 0) {
            existingMenuItems.filter(item => item.tenantId === tenantId).forEach(item => apiSync('/api/menu-items', 'POST', item))
          }
          const mergedCurrentUser = existingCurrentUser && existingCurrentUser.tenantId === tenantId
            ? parsedUsers.find((user: User) => user.id === existingCurrentUser.id) || existingCurrentUser
            : existingCurrentUser
          set({
            currentUser: mergedCurrentUser,
            orders: [...existingOrders.filter(order => order.tenantId !== tenantId), ...parsedOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            categories: [...existingCategories.filter(category => category.tenantId !== tenantId), ...parsedCategories],
            menuItems: [...existingMenuItems.filter(item => item.tenantId !== tenantId), ...parsedMenuItems],
            users: [...existingUsers.filter(user => user.tenantId !== tenantId), ...parsedUsers],
          })
        } catch (e) {
          console.error('initFromDB failed (using localStorage):', e)
        }
      },
    }),
    {
      name: 'buysial-pos-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState
        const nextState = { ...persistedState }
        if (nextState.currentUser?.role === 'super_admin') {
          nextState.currentUser = null
          nextState.currentTenant = null
          nextState.activeView = 'dashboard'
        }
        if (Array.isArray(nextState.users)) {
          nextState.users = nextState.users.filter((user: User) => user.role !== 'super_admin')
        }
        if (typeof nextState.sidebarOpen !== 'boolean') {
          nextState.sidebarOpen = false
        }
        return nextState
      },
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentTenant: state.currentTenant,
        language: state.language,
        theme: state.theme,
        activeView: state.activeView,
        sidebarOpen: state.sidebarOpen,
        orders: state.orders,
        users: state.users,
        categories: state.categories,
        menuItems: state.menuItems,
        tables: state.tables,
        inventoryItems: state.inventoryItems,
        attendance: state.attendance,
        tenants: state.tenants,
      }),
    }
  )
)
