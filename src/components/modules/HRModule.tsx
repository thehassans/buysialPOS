'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { User, UserRole, Language } from '@/lib/types'
import { MOCK_ATTENDANCE } from '@/lib/mock-data'
import { cn, getInitials, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils'
import {
  Users, Clock, DollarSign, Plus, LogIn, LogOut, CheckCircle,
  Pencil, Trash2, X, Save, Mail, Phone, Shield, AlertCircle
} from 'lucide-react'

const ROLE_OPTIONS: UserRole[] = ['admin', 'manager', 'waiter', 'cashier', 'chef']

const EMPTY_FORM: { name: string; email: string; role: UserRole; hourlyRate: number; isActive: boolean; language: Language } = {
  name: '', email: '', role: 'waiter',
  hourlyRate: 0, isActive: true, language: 'en',
}

export default function HRModule() {
  const { currentTenant, currentUser, users, addUser, updateUser, deleteUser } = useAppStore()
  const [tab, setTab] = useState<'staff' | 'attendance' | 'payroll'>('staff')
  const [clockedIn, setClockedIn] = useState<Set<string>>(new Set(MOCK_ATTENDANCE.map(a => a.userId)))
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'manager'
  const tenantId = currentTenant?.id || 't1'
  const tenantUsers = users.filter(u => u.tenantId === tenantId && u.role !== 'super_admin')

  const toggleClockIn = (userId: string) => {
    setClockedIn(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const openAdd = () => {
    setEditingUser(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, role: user.role, hourlyRate: user.hourlyRate || 0, isActive: user.isActive, language: user.language })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (editingUser) {
      updateUser(editingUser.id, { name: form.name, email: form.email, role: form.role, hourlyRate: form.hourlyRate, isActive: form.isActive, language: form.language })
    } else {
      addUser({
        id: `u-${Date.now()}`, tenantId,
        name: form.name, email: form.email, role: form.role,
        hourlyRate: form.hourlyRate, isActive: form.isActive,
        language: form.language, createdAt: new Date(),
      })
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    deleteUser(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">HR & Payroll</h2>
          <p className="text-slate-500 text-sm mt-0.5">{tenantUsers.length} staff members</p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: tenantUsers.length, icon: Users, color: 'text-blue-600' },
          { label: 'Present Today', value: clockedIn.size, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Monthly Payroll', value: 'SAR 42,800', icon: DollarSign, color: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">{stat.value}</div>
              <div className="text-emerald-600 text-xs">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'staff', label: 'Staff' },
          { id: 'attendance', label: 'Attendance' },
          { id: 'payroll', label: 'Payroll' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === t.id ? 'bg-emerald-700 text-white' : 'glass text-emerald-500 border border-gray-200 hover:text-emerald-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'staff' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantUsers.map(user => (
            <div key={user.id} className={cn(
              'bg-white rounded-2xl shadow-sm p-5 border transition-all group',
              user.isActive ? 'border-gray-200 hover:border-emerald-200' : 'border-gray-100 opacity-60'
            )}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-gray-900 font-bold text-sm">
                      {getInitials(user.name)}
                    </div>
                    <div className={cn('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white', clockedIn.has(user.id) ? 'bg-emerald-500' : 'bg-gray-300')} />
                  </div>
                  <div>
                    <div className="text-gray-900 font-semibold text-sm">{user.name}</div>
                    <div className="text-slate-400 text-xs">{user.email}</div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', ROLE_COLORS[user.role])}>
                  {ROLE_LABELS[user.role]}
                </span>
                <div className="flex items-center gap-2">
                  {user.hourlyRate && user.hourlyRate > 0 && (
                    <span className="text-slate-500 text-xs">{currentTenant?.currency || 'SAR'} {user.hourlyRate}/hr</span>
                  )}
                  {!user.isActive && <span className="text-[10px] text-red-500 font-medium">Inactive</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-gray-900 font-semibold text-sm">Today's Attendance</h3>
            <span className="text-emerald-500 text-xs">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {tenantUsers.map(user => {
              const isPresent = clockedIn.has(user.id)
              const attendance = MOCK_ATTENDANCE.find(a => a.userId === user.id)
              const clockInTime = attendance?.clockIn ? new Date(attendance.clockIn) : null
              const hoursWorked = clockInTime ? ((Date.now() - clockInTime.getTime()) / 3600000).toFixed(1) : '0'

              return (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-gray-900 text-xs font-bold flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 text-sm font-medium">{user.name}</div>
                    <div className="text-emerald-600 text-xs">{ROLE_LABELS[user.role]}</div>
                  </div>
                  <div className="text-center">
                    {isPresent && clockInTime ? (
                      <div>
                        <div className="text-emerald-700 text-xs font-medium">{clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-emerald-600 text-[10px]">{hoursWorked}h worked</div>
                      </div>
                    ) : (
                      <div className="text-emerald-800 text-xs">Not clocked in</div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleClockIn(user.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      isPresent
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-900/50'
                        : 'bg-emerald-50 text-emerald-700 border-gray-200 hover:bg-emerald-100'
                    )}
                  >
                    {isPresent ? <><LogOut className="w-3 h-3" /> Clock Out</> : <><LogIn className="w-3 h-3" /> Clock In</>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Employee', 'Role', 'Hours', 'Rate/hr', 'Gross Pay', 'Deductions', 'Net Pay'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenantUsers.filter(u => u.hourlyRate && u.hourlyRate > 0).map(user => {
                  const hours = 176
                  const gross = (user.hourlyRate || 0) * hours
                  const deductions = gross * 0.1
                  const net = gross - deductions
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-gray-900 text-sm font-medium">{user.name}</div>
                      </td>
                      <td className="px-4 py-3 text-emerald-500 text-sm">{ROLE_LABELS[user.role]}</td>
                      <td className="px-4 py-3 text-gray-900 text-sm">{hours}h</td>
                      <td className="px-4 py-3 text-emerald-700 text-sm">SAR {user.hourlyRate}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium text-sm">SAR {gross.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600 text-sm">SAR {deductions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-700 font-bold text-sm">SAR {net.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Edit Staff Member' : 'Add New Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ahmed Al-Rashidi"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="staff@restaurant.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 bg-white"
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Hourly Rate ({currentTenant?.currency || 'SAR'})</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.hourlyRate || ''}
                    onChange={e => setForm(f => ({ ...f, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Language</label>
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value as Language }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 flex-1">Active</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={cn('relative w-9 h-5 rounded-full transition-all', form.isActive ? 'bg-emerald-500' : 'bg-gray-200')}
                  >
                    <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', form.isActive ? 'translate-x-4' : 'translate-x-0.5')} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.email}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingUser ? 'Save Changes' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900">Remove Staff Member?</h3>
            <p className="text-slate-500 text-sm">This will permanently remove this staff member.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-slate-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
