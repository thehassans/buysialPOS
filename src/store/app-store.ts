import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Tenant, Order, OrderItem, MenuItem, Theme, Language, UserRole } from '@/lib/types'
import { MOCK_USERS, MOCK_TENANTS, MOCK_ORDERS, MOCK_MENU_ITEMS } from '@/lib/mock-data'

interface AppState {
  currentUser: User | null
  currentTenant: Tenant | null
  theme: Theme
  language: Language
  orders: Order[]
  users: User[]
  menuItems: MenuItem[]
  activeView: string
  sidebarOpen: boolean

  setCurrentUser: (user: User | null) => void
  setCurrentTenant: (tenant: Tenant | null) => void
  setTheme: (theme: Theme) => void
  setLanguage: (lang: Language) => void
  setActiveView: (view: string) => void
  toggleSidebar: () => void
  loginAs: (role: UserRole, tenantId?: string) => void
  logout: () => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
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
      menuItems: MOCK_MENU_ITEMS,
      activeView: 'dashboard',
      sidebarOpen: true,

      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setActiveView: (activeView) => set({ activeView }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      loginAs: (role, tenantId = 't1') => {
        const user = MOCK_USERS.find(u => u.role === role && u.tenantId === tenantId) || MOCK_USERS[0]
        const tenant = MOCK_TENANTS.find(t => t.id === tenantId) || MOCK_TENANTS[0]
        const defaultView: Record<string, string> = {
          waiter: 'pos', chef: 'kds', cashier: 'pos',
        }
        set({ currentUser: user, currentTenant: tenant, language: 'en', activeView: defaultView[role] || 'dashboard' })
      },

      logout: () => set({ currentUser: null, currentTenant: null }),

      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

      updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o)
      })),

      updateOrderItemStatus: (orderId, itemId, status) => set((state) => ({
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, status } : i), updatedAt: new Date() }
            : o
        )
      })),

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
      })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter(u => u.id !== id) })),

      addMenuItem: (item) => set((state) => ({ menuItems: [...state.menuItems, item] })),
      updateMenuItem: (id, updates) => set((state) => ({
        menuItems: state.menuItems.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      deleteMenuItem: (id) => set((state) => ({ menuItems: state.menuItems.filter(m => m.id !== id) })),
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
      }),
    }
  )
)
