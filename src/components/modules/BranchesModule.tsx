'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Branch } from '@/lib/types'
import { GitBranch, Plus, Edit2, Trash2, Check, X, MapPin, Phone, User, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BranchesModule() {
  const { currentTenant, branches, addBranch, updateBranch, deleteBranch } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formManager, setFormManager] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  if (!currentTenant) return null

  const tenantBranches = branches.filter(b => b.tenantId === currentTenant.id)

  const openAdd = () => {
    setEditingBranch(null)
    setFormName('')
    setFormAddress('')
    setFormPhone('')
    setFormManager('')
    setFormActive(true)
    setError('')
    setShowForm(true)
  }

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormName(branch.name)
    setFormAddress(branch.address || '')
    setFormPhone(branch.phone || '')
    setFormManager(branch.managerName || '')
    setFormActive(branch.isActive)
    setError('')
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formName.trim()) { setError('Branch name is required.'); return }
    const data: Partial<Branch> = {
      name: formName.trim(),
      address: formAddress.trim() || undefined,
      phone: formPhone.trim() || undefined,
      managerName: formManager.trim() || undefined,
      isActive: formActive,
    }
    if (editingBranch) {
      updateBranch(editingBranch.id, data)
    } else {
      addBranch({
        id: `branch-${currentTenant.id}-${Date.now()}`,
        tenantId: currentTenant.id,
        name: data.name!,
        address: data.address,
        phone: data.phone,
        managerName: data.managerName,
        isActive: data.isActive!,
        createdAt: new Date(),
      })
    }
    setShowForm(false)
    setEditingBranch(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-600" /> Branch Management
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{currentTenant.name} · {tenantBranches.length} branch{tenantBranches.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{editingBranch ? `Edit: ${editingBranch.name}` : 'Add New Branch'}</h3>
          {error && <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Branch Name *</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Riyadh - Olaya Branch"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                placeholder="+966-11-XXX-XXXX"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Branch Manager</label>
              <input
                value={formManager}
                onChange={e => setFormManager(e.target.value)}
                placeholder="Manager name"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <input
                value={formAddress}
                onChange={e => setFormAddress(e.target.value)}
                placeholder="Street, City, Country"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFormActive(v => !v)}
                className={cn('relative w-9 h-5 rounded-full transition-all', formActive ? 'bg-emerald-500' : 'bg-gray-200')}
              >
                <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', formActive ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
              <span className="text-sm text-slate-600">{formActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Check className="w-4 h-4" /> {editingBranch ? 'Save Changes' : 'Add Branch'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingBranch(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-xl text-sm font-medium transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Branch List */}
      {tenantBranches.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No branches yet</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add Branch" to set up your first branch location</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantBranches.map(branch => (
            <div key={branch.id} className={cn(
              'bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all',
              branch.isActive ? 'border-gray-200' : 'border-gray-100 opacity-70'
            )}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', branch.isActive ? 'bg-violet-100' : 'bg-gray-100')}>
                    <GitBranch className={cn('w-4 h-4', branch.isActive ? 'text-violet-600' : 'text-gray-400')} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{branch.name}</div>
                    <div className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5 inline-block', branch.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(branch)} className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(branch.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                {branch.managerName && (
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{branch.managerName}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                )}
                {!branch.managerName && !branch.phone && !branch.address && (
                  <span className="text-slate-300 italic">No contact info</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900">Delete Branch?</h3>
            <p className="text-slate-500 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-slate-600">Cancel</button>
              <button
                onClick={() => { deleteBranch(deleteConfirm); setDeleteConfirm(null) }}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
