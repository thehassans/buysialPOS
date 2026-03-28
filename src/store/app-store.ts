import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Tenant, Order, OrderItem, MenuItem, Table, Theme, Language, InventoryItem, AttendanceRecord, Category, Supplier, Branch } from '@/lib/types'
import { MOCK_USERS, MOCK_TENANTS, MOCK_ORDERS, MOCK_MENU_ITEMS, MOCK_TABLES, MOCK_INVENTORY, MOCK_ATTENDANCE, MOCK_CATEGORIES, MOCK_SUPPLIERS } from '@/lib/mock-data'
import { apiSync } from '@/lib/sync-queue'

const NO_STORE_FETCH_OPTIONS: RequestInit = { cache: 'no-store' }

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
  branches: Branch[]
  inventoryItems: InventoryItem[]
  suppliers: Supplier[]
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
  addTenant: (tenant: Tenant) => Promise<boolean>
  updateTenant: (id: string, updates: Partial<Tenant>) => void
  addCategory: (category: Category) => void
  setEditingOrder: (order: Order | null) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void
  addUser: (user: User) => Promise<boolean>
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  addMenuItem: (item: MenuItem) => void
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  addInventoryItem: (item: InventoryItem) => void
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (id: string) => void
  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: string, updates: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void
  toggleAttendance: (userId: string) => void
  reserveTable: (tableNumber: number, orderId: string) => void
  releaseTable: (tableNumber: number) => void
  addTable: (table: Table) => void
  updateTable: (id: string, updates: Partial<Table>) => void
  deleteTable: (id: string) => void
  addBranch: (branch: Branch) => void
  updateBranch: (id: string, updates: Partial<Branch>) => void
  deleteBranch: (id: string) => void
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
      branches: [],
      inventoryItems: MOCK_INVENTORY,
      suppliers: MOCK_SUPPLIERS,
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

      addTenant: async (tenant) => {
        const previousTenants = get().tenants
        const previousCurrentTenant = get().currentTenant
        set((state) => ({
          tenants: [...state.tenants.filter(existing => existing.id !== tenant.id), tenant],
          currentTenant: state.currentTenant?.id === tenant.id ? tenant : state.currentTenant,
        }))
        const synced = await apiSync('/api/tenants', 'POST', tenant)
        if (!synced) {
          set({ tenants: previousTenants, currentTenant: previousCurrentTenant })
          return false
        }
        return true
      },
      updateTenant: (id, updates) => {
        set((state) => {
          const nextTenants = state.tenants.map(t => t.id === id ? { ...t, ...updates } : t)
          const nextCurrentTenant = state.currentTenant?.id === id
            ? { ...state.currentTenant, ...updates }
            : state.currentTenant
          return {
            tenants: nextTenants,
            currentTenant: nextCurrentTenant,
          }
        })
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

      addUser: async (user) => {
        const previousUsers = get().users
        set((state) => ({ users: [...state.users.filter(existing => existing.id !== user.id), user] }))
        const synced = await apiSync('/api/users', 'POST', user)
        if (!synced) {
          set({ users: previousUsers })
          return false
        }
        return true
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
        set((state) => ({ inventoryItems: [...state.inventoryItems.filter(existing => existing.id !== item.id), item] }))
        apiSync('/api/inventory', 'POST', item)
      },
      updateInventoryItem: (id, updates) => {
        set((state) => ({ inventoryItems: state.inventoryItems.map(item => item.id === id ? { ...item, ...updates } : item) }))
        apiSync(`/api/inventory/${id}`, 'PATCH', updates)
      },
      deleteInventoryItem: (id) => {
        set((state) => ({ inventoryItems: state.inventoryItems.filter(item => item.id !== id) }))
        apiSync(`/api/inventory/${id}`, 'DELETE')
      },
      addSupplier: (supplier) => {
        set((state) => ({ suppliers: [...state.suppliers.filter(existing => existing.id !== supplier.id), supplier] }))
        apiSync('/api/suppliers', 'POST', supplier)
      },
      updateSupplier: (id, updates) => {
        set((state) => ({ suppliers: state.suppliers.map(supplier => supplier.id === id ? { ...supplier, ...updates } : supplier) }))
        apiSync(`/api/suppliers/${id}`, 'PATCH', updates)
      },
      deleteSupplier: (id) => {
        set((state) => ({ suppliers: state.suppliers.filter(supplier => supplier.id !== id) }))
        apiSync(`/api/suppliers/${id}`, 'DELETE')
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

      addTable: (table: Table) => {
        set((state) => ({ tables: [...state.tables.filter(existing => existing.id !== table.id), table] }))
        apiSync('/api/tables', 'POST', table)
      },

      updateTable: (id: string, updates: Partial<Table>) => {
        set((state) => ({ tables: state.tables.map(t => t.id === id ? { ...t, ...updates } : t) }))
        apiSync(`/api/tables/${id}`, 'PATCH', updates)
      },

      deleteTable: (id: string) => {
        set((state) => ({ tables: state.tables.filter(t => t.id !== id) }))
        apiSync(`/api/tables/${id}`, 'DELETE')
      },

      addBranch: (branch) => set((state) => ({ branches: [...state.branches, branch] })),
      updateBranch: (id, updates) => set((state) => ({ branches: state.branches.map(b => b.id === id ? { ...b, ...updates } : b) })),
      deleteBranch: (id) => set((state) => ({ branches: state.branches.filter(b => b.id !== id) })),

      initPlatformData: async () => {
        try {
          const existingUsers = get().users
          const existingTenants = get().tenants
          const existingCurrentTenant = get().currentTenant
          const [tenantsRes, usersRes] = await Promise.all([
            fetch('/api/tenants', NO_STORE_FETCH_OPTIONS),
            fetch('/api/users', NO_STORE_FETCH_OPTIONS),
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
          const existingInventoryItems = get().inventoryItems
          const existingSuppliers = get().suppliers
          const existingTables = get().tables
          const existingCurrentUser = get().currentUser
          const [ordersRes, menuRes, usersRes, categoriesRes, inventoryRes, suppliersRes, tablesRes] = await Promise.all([
            fetch(`/api/orders?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
            fetch(`/api/menu-items?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
            fetch(`/api/users?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
            fetch(`/api/categories?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
            fetch(`/api/inventory?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
            fetch(`/api/suppliers?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
            fetch(`/api/tables?tenantId=${tenantId}`, NO_STORE_FETCH_OPTIONS),
          ])
          if (!ordersRes.ok || !menuRes.ok || !usersRes.ok || !categoriesRes.ok || !inventoryRes.ok || !suppliersRes.ok) return
          const [orders, menuItems, users, categories, inventoryItems, suppliers] = await Promise.all([
            ordersRes.json(), menuRes.json(), usersRes.json(), categoriesRes.json(), inventoryRes.json(), suppliersRes.json(),
          ])
          // tables fetch is best-effort
          let dbTables: any[] = []
          if (tablesRes.ok) {
            dbTables = await tablesRes.json()
          }
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
          const parsedInventoryItems = inventoryItems.map((item: InventoryItem) => ({
            ...item,
            quantity: Number(item.quantity ?? 0),
            minQuantity: Number(item.minQuantity ?? 0),
            costPerUnit: Number(item.costPerUnit ?? 0),
            lastRestocked: item.lastRestocked ? new Date(item.lastRestocked) : undefined,
          }))
          const parsedSuppliers = suppliers.map((supplier: Supplier) => ({
            ...supplier,
            isActive: supplier.isActive ?? true,
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
          if (parsedInventoryItems.length === 0) {
            existingInventoryItems.filter(item => item.tenantId === tenantId).forEach(item => apiSync('/api/inventory', 'POST', item))
          }
          if (parsedSuppliers.length === 0) {
            existingSuppliers.filter(supplier => supplier.tenantId === tenantId).forEach(supplier => apiSync('/api/suppliers', 'POST', supplier))
          }
          if (dbTables.length === 0) {
            existingTables.filter(t => t.tenantId === tenantId).forEach(t => apiSync('/api/tables', 'POST', t))
          }
          const mergedCurrentUser = existingCurrentUser && existingCurrentUser.tenantId === tenantId
            ? parsedUsers.find((user: User) => user.id === existingCurrentUser.id) || existingCurrentUser
            : existingCurrentUser
          set({
            currentUser: mergedCurrentUser,
            orders: [...existingOrders.filter(order => order.tenantId !== tenantId), ...parsedOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            categories: [...existingCategories.filter(category => category.tenantId !== tenantId), ...parsedCategories],
            menuItems: [...existingMenuItems.filter(item => item.tenantId !== tenantId), ...parsedMenuItems],
            inventoryItems: [...existingInventoryItems.filter(item => item.tenantId !== tenantId), ...parsedInventoryItems],
            suppliers: [...existingSuppliers.filter(supplier => supplier.tenantId !== tenantId), ...parsedSuppliers],
            users: [...existingUsers.filter(user => user.tenantId !== tenantId), ...parsedUsers],
            tables: dbTables.length > 0
              ? [...existingTables.filter(t => t.tenantId !== tenantId), ...dbTables]
              : existingTables,
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
        if (!Array.isArray(nextState.suppliers)) {
          nextState.suppliers = MOCK_SUPPLIERS
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
        suppliers: state.suppliers,
        attendance: state.attendance,
        tenants: state.tenants,
      }),
    }
  )
)
