import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Tenant, Order, OrderItem, MenuItem, Table, Theme, Language, UserRole } from '@/lib/types'
import { MOCK_USERS, MOCK_TENANTS, MOCK_ORDERS, MOCK_MENU_ITEMS, MOCK_TABLES } from '@/lib/mock-data'

interface AppState {
  currentUser: User | null
  currentTenant: Tenant | null
  theme: Theme
  language: Language
  orders: Order[]
  users: User[]
  tenants: Tenant[]
  menuItems: MenuItem[]
  tables: Table[]
  activeView: string
  sidebarOpen: boolean
  editingOrder: Order | null

  setCurrentUser: (user: User | null) => void
  setCurrentTenant: (tenant: Tenant | null) => void
  setTheme: (theme: Theme) => void
  setLanguage: (lang: Language) => void
  setActiveView: (view: string) => void
  toggleSidebar: () => void
  loginAs: (role: UserRole, tenantId?: string) => void
  loginWithCredentials: (email: string, pass: string) => { success: boolean; error?: string; role?: UserRole }
  logout: () => void
  setEditingOrder: (order: Order | null) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void
  addTenant: (tenant: Tenant) => void
  updateTenant: (id: string, updates: Partial<Tenant>) => void
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  reserveTable: (tableNumber: number, orderId: string) => void
  releaseTable: (tableNumber: number) => void
  initFromDB: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentTenant: null,
      theme: 'light',
      language: 'en',
      orders: MOCK_ORDERS,
      users: MOCK_USERS,
      tenants: MOCK_TENANTS,
      menuItems: MOCK_MENU_ITEMS,
      tables: MOCK_TABLES,
      activeView: 'dashboard',
      sidebarOpen: true,
      editingOrder: null,

      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setActiveView: (activeView) => set({ activeView }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      loginAs: (role, tenantId = 't1') => {
        const user = get().users.find(u => u.role === role && u.tenantId === tenantId) || get().users[0]
        const tenant = get().tenants.find(t => t.id === tenantId) || get().tenants[0]
        const defaultView: Record<string, string> = {
          waiter: 'pos', chef: 'kds', cashier: 'pos',
        }
        set({ currentUser: user, currentTenant: tenant, language: 'en', activeView: defaultView[role] || 'dashboard' })
      },

      loginWithCredentials: (email, pass) => {
        if (email === 'admin@buysial.com' && pass === 'superadmin123') {
          const u = get().users.find(x => x.role === 'super_admin') || get().users[0]
          set({ currentUser: u, currentTenant: get().tenants[0], language: 'en', activeView: 'dashboard' })
          return { success: true, role: 'super_admin' }
        }
        const tenant = get().tenants.find(t => t.email.toLowerCase() === email.toLowerCase())
        if (tenant && tenant.adminPassword === pass) {
          const adminUser = get().users.find(x => x.tenantId === tenant.id && x.role === 'admin')
            || { id: `u-${Date.now()}`, tenantId: tenant.id, name: tenant.name + ' Admin', email, role: 'admin', isActive: true, language: 'en', createdAt: new Date() } as User
          set({ currentUser: adminUser, currentTenant: tenant, language: 'en', activeView: 'dashboard' })
          return { success: true, role: 'admin' }
        }
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.password === pass || pass === u.role + '123'))
        if (user) {
          const uTenant = get().tenants.find(t => t.id === user.tenantId) || get().tenants[0]
          const dv: Record<string, string> = { waiter: 'pos', chef: 'kds', cashier: 'pos' }
          set({ currentUser: user, currentTenant: uTenant, language: 'en', activeView: dv[user.role] || 'dashboard' })
          return { success: true, role: user.role }
        }
        return { success: false, error: 'Invalid email or password' }
      },

      logout: () => set({ currentUser: null, currentTenant: null }),

      setEditingOrder: (order) => set({ editingOrder: order }),

      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }))
        fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
          .then(() => {
            if (typeof navigator !== 'undefined' && navigator.onLine) {
              fetch('/api/sync/trigger', { method: 'POST' }).catch(e => console.error('Auto sync failed:', e))
            }
          })
          .catch(e => console.error('DB sync addOrder:', e))
      },

      updateOrder: (id, updates) => {
        set((state) => ({ orders: state.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o) }))
        fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
          .catch(e => console.error('DB sync updateOrder:', e))
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
        if (updatedItems) {
          fetch(`/api/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: updatedItems }) })
            .catch(e => console.error('DB sync updateOrderItemStatus:', e))
        }
      },

      addTenant: (tenant) => set(s => ({ tenants: [tenant, ...s.tenants] })),
      updateTenant: (id, updates) => set(s => ({ tenants: s.tenants.map(t => t.id === id ? { ...t, ...updates } : t) })),

      addUser: (user) => {
        set((state) => ({ users: [...state.users, user] }))
        fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) })
          .catch(e => console.error('DB sync addUser:', e))
      },
      updateUser: (id, updates) => {
        set((state) => ({ users: state.users.map(u => u.id === id ? { ...u, ...updates } : u) }))
        fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
          .catch(e => console.error('DB sync updateUser:', e))
      },
      deleteUser: (id) => {
        set((state) => ({ users: state.users.filter(u => u.id !== id) }))
        fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(e => console.error('DB sync deleteUser:', e))
      },

      addMenuItem: (item) => {
        set((state) => ({ menuItems: [...state.menuItems, item] }))
        fetch('/api/menu-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
          .catch(e => console.error('DB sync addMenuItem:', e))
      },
      updateMenuItem: (id, updates) => {
        set((state) => ({ menuItems: state.menuItems.map(m => m.id === id ? { ...m, ...updates } : m) }))
        fetch(`/api/menu-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
          .catch(e => console.error('DB sync updateMenuItem:', e))
      },
      deleteMenuItem: (id) => {
        set((state) => ({ menuItems: state.menuItems.filter(m => m.id !== id) }))
        fetch(`/api/menu-items/${id}`, { method: 'DELETE' }).catch(e => console.error('DB sync deleteMenuItem:', e))
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

      initFromDB: async () => {
        try {
          const tenantId = get().currentTenant?.id
          if (!tenantId) return
          const [ordersRes, menuRes, usersRes] = await Promise.all([
            fetch(`/api/orders?tenantId=${tenantId}`),
            fetch(`/api/menu-items?tenantId=${tenantId}`),
            fetch(`/api/users?tenantId=${tenantId}`),
          ])
          if (!ordersRes.ok || !menuRes.ok || !usersRes.ok) return
          const [orders, menuItems, users] = await Promise.all([
            ordersRes.json(), menuRes.json(), usersRes.json(),
          ])
          set({
            orders: orders.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt) })),
            menuItems,
            users: users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt) })),
          })
        } catch (e) {
          console.error('initFromDB failed (using localStorage):', e)
        }
      },
    }),
    {
      name: 'buysial-pos-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentTenant: state.currentTenant,
        language: state.language,
        theme: state.theme,
        activeView: state.activeView,
        orders: state.orders,
        users: state.users,
        tenants: state.tenants,
        menuItems: state.menuItems,
        tables: state.tables,
      }),
    }
  )
)
