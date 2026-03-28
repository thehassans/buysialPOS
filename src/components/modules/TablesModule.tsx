'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Table } from '@/lib/types'
import { Table2, Plus, Trash2, Edit2, Check, X, Users, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TablesModule() {
  const { currentTenant, tables, addTable, updateTable, deleteTable } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [formNumber, setFormNumber] = useState('')
  const [formCapacity, setFormCapacity] = useState('4')
  const [formSection, setFormSection] = useState('')
  const [error, setError] = useState('')

  if (!currentTenant) return null

  const tenantTables = tables
    .filter(t => t.tenantId === currentTenant.id)
    .sort((a, b) => a.number - b.number)

  const openAdd = () => {
    setEditingTable(null)
    setFormNumber('')
    setFormCapacity('4')
    setFormSection('')
    setError('')
    setShowForm(true)
  }

  const openEdit = (table: Table) => {
    setEditingTable(table)
    setFormNumber(String(table.number))
    setFormCapacity(String(table.capacity))
    setFormSection(table.section || '')
    setError('')
    setShowForm(true)
  }

  const handleSave = () => {
    const num = parseInt(formNumber, 10)
    const cap = parseInt(formCapacity, 10)
    if (!formNumber || isNaN(num) || num < 1) { setError('Enter a valid table number.'); return }
    if (isNaN(cap) || cap < 1) { setError('Enter a valid capacity.'); return }
    // duplicate check
    const duplicate = tenantTables.find(t => t.number === num && t.id !== editingTable?.id)
    if (duplicate) { setError(`Table ${num} already exists.`); return }

    if (editingTable) {
      updateTable(editingTable.id, {
        number: num,
        capacity: cap,
        section: formSection || undefined,
      })
    } else {
      const newId = `table-${currentTenant.id}-${Date.now()}`
      addTable({
        id: newId,
        tenantId: currentTenant.id,
        number: num,
        capacity: cap,
        isOccupied: false,
        section: formSection || undefined,
      })
    }
    setShowForm(false)
    setEditingTable(null)
  }

  const handleDelete = (table: Table) => {
    if (table.isOccupied) return
    if (!confirm(`Delete Table ${table.number}? This cannot be undone.`)) return
    deleteTable(table.id)
  }

  // Section grouping
  const sections = Array.from(new Set(tenantTables.map(t => t.section || 'General'))).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Table2 className="w-5 h-5 text-blue-600" /> Table Management
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{currentTenant.name} · {tenantTables.length} tables configured</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Tables are sorted by number and appear in this sequence on the POS screen. Set sections to group tables (e.g., Main Hall, Garden, Private).</span>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-gray-900 font-semibold mb-4">{editingTable ? `Edit Table ${editingTable.number}` : 'Add New Table'}</h3>
          {error && <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Table Number *</label>
              <input
                type="number"
                min={1}
                value={formNumber}
                onChange={e => setFormNumber(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Capacity (seats) *</label>
              <input
                type="number"
                min={1}
                value={formCapacity}
                onChange={e => setFormCapacity(e.target.value)}
                placeholder="e.g. 4"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Section (optional)</label>
              <input
                type="text"
                value={formSection}
                onChange={e => setFormSection(e.target.value)}
                placeholder="e.g. Main Hall, Garden"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <Check className="w-4 h-4" /> {editingTable ? 'Save Changes' : 'Add Table'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingTable(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded-xl text-sm font-medium transition-all"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tables grouped by section */}
      {tenantTables.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <Table2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tables configured yet</p>
          <p className="text-slate-400 text-sm mt-1">Click "Add Table" to set up your floor plan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map(section => (
            <div key={section} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{section}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                  {tenantTables.filter(t => (t.section || 'General') === section).length} tables
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tenantTables
                  .filter(t => (t.section || 'General') === section)
                  .map(table => (
                    <div
                      key={table.id}
                      className={cn(
                        'relative rounded-xl border p-3 text-center transition-all',
                        table.isOccupied
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                      )}
                    >
                      <div className={cn(
                        'text-2xl font-black mb-1',
                        table.isOccupied ? 'text-red-600' : 'text-blue-700'
                      )}>
                        T{table.number}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-2">
                        <Users className="w-3 h-3" /> {table.capacity}
                      </div>
                      <div className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-semibold mb-2',
                        table.isOccupied ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {table.isOccupied ? 'Occupied' : 'Free'}
                      </div>
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => openEdit(table)}
                          className="p-1 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(table)}
                          disabled={table.isOccupied}
                          className={cn(
                            'p-1 rounded-lg border transition-all',
                            table.isOccupied
                              ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:bg-red-50 text-slate-500 hover:text-red-600'
                          )}
                          title={table.isOccupied ? 'Cannot delete occupied table' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
