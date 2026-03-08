'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { COUNTRY_CONFIGS } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { Settings, Save, Upload, Building2, Receipt, Globe, Shield, Check, ToggleLeft, ToggleRight, AlertCircle, QrCode, Calendar, FileText, BadgeCheck, Hash } from 'lucide-react'

function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className={cn(
        'relative w-11 h-6 rounded-full transition-all flex-shrink-0',
        enabled ? 'bg-emerald-500' : 'bg-gray-200',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
      )}
    >
      <div className={cn(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
        enabled ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </button>
  )
}

const ZATCA_FEATURES = [
  { id: 'qrCode',        icon: QrCode,      label: 'ZATCA QR Code',        labelAr: 'رمز QR الزاتكا',       desc: 'TLV-encoded in all invoices',         descAr: 'مُضمَّن في جميع الفواتير' },
  { id: 'eInvoiceP2',   icon: FileText,    label: 'E-Invoice Phase 2',    labelAr: 'الفاتورة الإلكترونية',  desc: 'Full ZATCA integration mode',         descAr: 'تكامل كامل مع الزاتكا' },
  { id: 'hijriCalendar', icon: Calendar,    label: 'Hijri Calendar',        labelAr: 'التقويم الهجري',         desc: 'Dual date display (Hijri + Gregorian)', descAr: 'عرض التاريخين الهجري والميلادي' },
  { id: 'trnDisplay',   icon: Hash,        label: 'TRN on Invoice',        labelAr: 'الرقم الضريبي في الفاتورة', desc: 'Tax Registration Number shown',     descAr: 'إظهار رقم التسجيل الضريبي' },
  { id: 'xmlSigning',   icon: BadgeCheck,  label: 'XML Digital Signing',  labelAr: 'التوقيع الرقمي XML',    desc: 'Cryptographic invoice signing',       descAr: 'توقيع رقمي مشفر للفواتير' },
  { id: 'clearance',    icon: Shield,      label: 'ZATCA Clearance',       labelAr: 'مقاصة الزاتكا',          desc: 'Real-time clearance submission',      descAr: 'إرسال فوري للمقاصة' },
]

const FTA_FEATURES = [
  { id: 'ftaCompliance', icon: Shield,     label: 'FTA Compliance',        labelAr: 'امتثال هيئة الضرائب',   desc: 'Federal Tax Authority UAE',           descAr: 'هيئة الاتحادية للضرائب الإماراتية' },
  { id: 'trnDisplay',    icon: Hash,       label: 'TRN Display',           labelAr: 'الرقم الضريبي',          desc: 'Tax Registration Number on invoices', descAr: 'إظهار رقم التسجيل الضريبي' },
  { id: 'eInvoice',      icon: FileText,   label: 'E-Invoice',             labelAr: 'الفاتورة الإلكترونية',  desc: 'AED electronic invoicing standard',   descAr: 'معيار الفواتير الإلكترونية' },
  { id: 'vatReporting',  icon: Receipt,    label: 'VAT Reporting',         labelAr: 'تقارير ضريبة القيمة',   desc: 'Periodic VAT return data',            descAr: 'بيانات الإقرار الضريبي الدوري' },
]

const OTA_FEATURES = [
  { id: 'otaCompliance', icon: Shield,     label: 'OTA Compliance',        labelAr: 'امتثال الهيئة العُمانية', desc: 'Oman Tax Authority standard',        descAr: 'معيار هيئة الضرائب العُمانية' },
  { id: 'trnDisplay',    icon: Hash,       label: 'TRN Display',           labelAr: 'الرقم الضريبي',           desc: 'Tax Registration Number shown',      descAr: 'إظهار رقم التسجيل الضريبي' },
  { id: 'vatInvoice',    icon: FileText,   label: 'VAT Invoice',           labelAr: 'فاتورة ضريبية',           desc: 'OMR VAT-compliant invoicing',        descAr: 'فواتير متوافقة مع ضريبة القيمة المضافة' },
  { id: 'simplifiedInv', icon: Receipt,    label: 'Simplified Invoice',    labelAr: 'فاتورة مبسطة',            desc: 'For transactions under OMR 500',     descAr: 'للمعاملات أقل من 500 ريال عُماني' },
]

export default function SettingsModule() {
  const { currentTenant } = useAppStore()
  const [tab, setTab] = useState<'general' | 'tax' | 'invoice' | 'compliance'>('compliance')
  const [saved, setSaved] = useState(false)
  const [vatRate, setVatRate] = useState(((currentTenant?.vatRate || 0.15) * 100).toString())
  const [invoiceFooter, setInvoiceFooter] = useState(currentTenant?.invoiceFooter || '')
  const [restaurantName, setRestaurantName] = useState(currentTenant?.name || '')
  const [complianceActive, setComplianceActive] = useState(true)

  const country = currentTenant?.countryCode || 'KSA'
  const features = country === 'KSA' ? ZATCA_FEATURES : country === 'UAE' ? FTA_FEATURES : OTA_FEATURES
  const defaultEnabled: Record<string, boolean> = Object.fromEntries(features.map(f => [f.id, true]))
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>(defaultEnabled)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!currentTenant) return null
  const countryConfig = COUNTRY_CONFIGS[currentTenant.countryCode]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all',
            saved ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          )}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {[
          { id: 'general', label: 'General', icon: Building2 },
          { id: 'tax', label: 'Tax & VAT', icon: Receipt },
          { id: 'invoice', label: 'Invoice', icon: Receipt },
          { id: 'compliance', label: 'Compliance', icon: Shield },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
              tab === t.id ? 'bg-emerald-700 text-white' : 'glass text-emerald-500 border border-gray-200 hover:text-emerald-700'
            )}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-5">
            <h3 className="text-gray-900 font-semibold">Restaurant Details</h3>
            {[
              { label: 'Restaurant Name', value: restaurantName, onChange: setRestaurantName, type: 'text' },
              { label: 'Email', value: currentTenant.email, onChange: () => {}, type: 'email' },
              { label: 'Phone', value: currentTenant.phone, onChange: () => {}, type: 'tel' },
              { label: 'Address', value: currentTenant.address, onChange: () => {}, type: 'text' },
            ].map(field => (
              <div key={field.label}>
                <label className="text-emerald-500 text-xs font-medium block mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  defaultValue={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-5">
            <h3 className="text-gray-900 font-semibold">Branding</h3>
            <div>
              <label className="text-emerald-500 text-xs font-medium block mb-1.5">Restaurant Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl font-bold text-gray-900">
                  {currentTenant.name.charAt(0)}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-emerald-600 border border-gray-200 hover:text-emerald-700 transition-all">
                  <Upload className="w-4 h-4" /> Upload Logo
                </button>
              </div>
            </div>
            <div>
              <label className="text-emerald-500 text-xs font-medium block mb-1.5">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  defaultValue={currentTenant.primaryColor || '#059669'}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <span className="text-emerald-600 text-sm font-mono">{currentTenant.primaryColor || '#059669'}</span>
              </div>
            </div>
            <div>
              <label className="text-emerald-500 text-xs font-medium block mb-1.5">Country & Currency</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl shadow-sm border border-gray-200">
                <span>{currentTenant.countryCode === 'KSA' ? '🇸🇦' : currentTenant.countryCode === 'UAE' ? '🇦🇪' : '🇴🇲'}</span>
                <span className="text-gray-900 text-sm">{countryConfig.name}</span>
                <span className="ml-auto text-emerald-500 text-xs">{countryConfig.currency} · {countryConfig.currencySymbol}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tax' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-5 max-w-lg">
          <h3 className="text-gray-900 font-semibold">Tax Configuration</h3>
          <div className="p-4 bg-emerald-50 border border-gray-200 rounded-xl text-xs text-emerald-600">
            <div className="font-medium mb-1">Tax Engine Formula:</div>
            <div className="font-mono text-emerald-700">Total = Subtotal + (Subtotal × VAT_Rate)</div>
            <div className="text-emerald-600 mt-1">VAT_Rate is dynamically pulled from tenant.countryCode</div>
          </div>
          <div>
            <label className="text-emerald-500 text-xs font-medium block mb-1.5">VAT Rate (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={vatRate}
                onChange={e => setVatRate(e.target.value)}
                min="0"
                max="30"
                step="0.5"
                className="w-32 px-3 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-emerald-600"
              />
              <span className="text-emerald-500 text-sm">%</span>
              <span className="text-emerald-600 text-xs ml-2">(Default for {countryConfig.name}: {countryConfig.vatRate * 100}%)</span>
            </div>
          </div>
          <div>
            <label className="text-emerald-500 text-xs font-medium block mb-1.5">VAT Registration Number</label>
            <input
              type="text"
              defaultValue={currentTenant.vatNumber}
              className="w-full px-3 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-emerald-600 font-mono"
              placeholder="Enter VAT number..."
            />
          </div>
        </div>
      )}

      {tab === 'invoice' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-5 max-w-lg">
          <h3 className="text-gray-900 font-semibold">Invoice Settings</h3>
          <div>
            <label className="text-emerald-500 text-xs font-medium block mb-1.5">Invoice Footer Text</label>
            <textarea
              value={invoiceFooter}
              onChange={e => setInvoiceFooter(e.target.value)}
              rows={3}
              placeholder="e.g. Thank you for dining with us!"
              className="w-full px-3 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 placeholder-emerald-700 border border-gray-200 focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>
          <div>
            <label className="text-emerald-500 text-xs font-medium block mb-1.5">Thermal Printer</label>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-900 text-sm">Star TSP100 · USB Connected</span>
              <button className="ml-auto text-xs text-emerald-500 hover:text-emerald-700">Configure</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="space-y-4 max-w-2xl">
          {/* Master switch */}
          <div className={cn(
            'bg-white rounded-2xl shadow-sm p-5 border flex items-center gap-4',
            complianceActive
              ? country === 'KSA' ? 'border-emerald-300' : country === 'UAE' ? 'border-amber-300' : 'border-red-300'
              : 'border-gray-200'
          )}>
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              complianceActive ? 'bg-emerald-100' : 'bg-gray-100'
            )}>
              <Shield className={cn('w-6 h-6', complianceActive ? 'text-emerald-600' : 'text-gray-400')} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-gray-900 font-bold">{countryConfig.complianceLabel}</h3>
                {complianceActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200">
                    <Check className="w-2.5 h-2.5" /> Active
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">{countryConfig.name} Tax Authority Compliance</p>
              <p className="text-slate-400 text-xs">VAT Rate: <span className="font-semibold text-emerald-600">{countryConfig.vatRate * 100}%</span> · TRN: <span className="font-mono">{currentTenant.vatNumber || 'Not set'}</span></p>
            </div>
            <Toggle enabled={complianceActive} onToggle={() => {
              setComplianceActive(!complianceActive)
              if (complianceActive) setFeatureToggles(Object.fromEntries(features.map(f => [f.id, false])))
              else setFeatureToggles(Object.fromEntries(features.map(f => [f.id, true])))
            }} />
          </div>

          {!complianceActive && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Compliance is disabled. Invoices will not be legally compliant. Enable to activate all features.
            </div>
          )}

          {/* Per-feature toggles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700">Feature Configuration</h4>
              <p className="text-xs text-slate-500 mt-0.5">Enable or disable individual compliance features</p>
            </div>
            <div className="divide-y divide-gray-100">
              {features.map(feature => {
                const enabled = featureToggles[feature.id] ?? true
                const Icon = feature.icon
                return (
                  <div key={feature.id} className={cn(
                    'flex items-center gap-4 px-5 py-4 transition-colors',
                    !complianceActive && 'opacity-50',
                    enabled && complianceActive ? 'bg-white' : 'bg-gray-50/50'
                  )}>
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      enabled && complianceActive ? 'bg-emerald-100' : 'bg-gray-100'
                    )}>
                      <Icon className={cn('w-4 h-4', enabled && complianceActive ? 'text-emerald-600' : 'text-gray-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{feature.label}</span>
                        {enabled && complianceActive && (
                          <span className="text-[10px] text-emerald-600 font-semibold">ENABLED</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{feature.desc}</p>
                    </div>
                    <Toggle
                      enabled={enabled}
                      disabled={!complianceActive}
                      onToggle={() => setFeatureToggles(prev => ({ ...prev, [feature.id]: !enabled }))}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Enabled Features', value: Object.values(featureToggles).filter(Boolean).length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Disabled Features', value: features.length - Object.values(featureToggles).filter(Boolean).length, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
              { label: 'VAT Rate', value: `${countryConfig.vatRate * 100}%`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-xl p-3 border text-center', s.bg)}>
                <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
