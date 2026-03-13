import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Tenant, Order, OrderItem, MenuItem, Table, Theme, Language, UserRole } from '@/lib/types'
import { MOCK_USERS, MOCK_TENANTS, MOCK_ORDERS, MOCK_MENU_ITEMS, MOCK_TABLES } from '@/lib/mock-data'
import { apiSync } from '@/lib/sync-queue'

interface AppState {
  currentUser: User | null
  currentTenant: Tenant | null
  tenants: Tenant[]
  theme: Theme
  language: Language
  orders: Order[]
  users: User[]
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
  login: (email: string, password: string) => { success: boolean; error?: string }
  loginAs: (role: UserRole, tenantId?: string) => void
  logout: () => void
  addTenant: (tenant: Tenant) => void
  updateTenant: (id: string, updates: Partial<Tenant>) => void
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
  reserveTable: (tableNumber: number, orderId: string) => void
  releaseTable: (tableNumber: number) => void
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

      login: (email, password) => {
        const allUsers = get().users
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
        if (!user) return { success: false, error: 'No account found with this email' }
        if (user.password && user.password !== password) return { success: false, error: 'Incorrect password' }
        if (!user.isActive) return { success: false, error: 'Account is deactivated. Contact your admin.' }
        const tenants = get().tenants
        const tenant = user.role === 'super_admin'
          ? (tenants[0] || MOCK_TENANTS[0])
          : tenants.find(t => t.id === user.tenantId)
        if (!tenant) return { success: false, error: 'Tenant not found. Contact platform support.' }
        const defaultView: Record<string, string> = {
          super_admin: 'dashboard', admin: 'dashboard', manager: 'dashboard',
          waiter: 'pos', chef: 'kds', cashier: 'pos',
        }
        set({ currentUser: user, currentTenant: tenant, language: user.language || 'en', activeView: defaultView[user.role] || 'dashboard' })
        return { success: true }
      },

      loginAs: (role, tenantId = 't1') => {
        const user = MOCK_USERS.find(u => u.role === role && u.tenantId === tenantId) || MOCK_USERS[0]
        const tenant = MOCK_TENANTS.find(t => t.id === tenantId) || MOCK_TENANTS[0]
        const defaultView: Record<string, string> = {
          waiter: 'pos', chef: 'kds', cashier: 'pos',
        }
        set({ currentUser: user, currentTenant: tenant, language: 'en', activeView: defaultView[role] || 'dashboard' })
      },

      logout: () => set({ currentUser: null, currentTenant: null }),

      addTenant: (tenant) => set((state) => ({ tenants: [...state.tenants, tenant] })),
      updateTenant: (id, updates) => set((state) => ({ tenants: state.tenants.map(t => t.id === id ? { ...t, ...updates } : t) })),

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
        menuItems: state.menuItems,
        tables: state.tables,
        tenants: state.tenants,
      }),
    }
  )
)
