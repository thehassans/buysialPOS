'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { UserRole } from '@/lib/types'
import Image from 'next/image'
import {
  ChefHat, Shield, Building2, BarChart3, Receipt, Users,
  Eye, EyeOff, ArrowRight, Globe, Lock,
  CheckCircle, Star, Zap, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLES: { role: UserRole; label: string; icon: any; desc: string; color: string; gradient: string; country?: string; password?: string }[] = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    icon: Shield,
    desc: 'Full platform control',
    color: 'from-blue-600 to-indigo-700',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
    password: 'superadmin123'
  },
  {
    role: 'admin',
    label: 'Owner / Admin',
    icon: Building2,
    desc: 'Restaurant management',
    color: 'from-slate-700 to-gray-900',
    gradient: 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200',
    password: 'admin123'
  },
  {
    role: 'manager',
    label: 'Manager',
    icon: BarChart3,
    desc: 'Reports & operations',
    color: 'from-sky-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200',
    password: 'manager123'
  },
  {
    role: 'waiter',
    label: 'Waiter',
    icon: Users,
    desc: 'Table ordering',
    color: 'from-cyan-500 to-teal-600',
    gradient: 'bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200',
    password: 'waiter123'
  },
  {
    role: 'chef',
    label: 'Chef / KDS',
    icon: ChefHat,
    desc: 'Kitchen display',
    color: 'from-orange-500 to-red-600',
    gradient: 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200',
    password: 'chef123'
  },
  {
    role: 'cashier',
    label: 'Cashier',
    icon: Receipt,
    desc: 'Checkout & invoices',
    color: 'from-emerald-500 to-teal-600',
    gradient: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
    password: 'cashier123'
  },
]

const FEATURES = [
  { icon: Zap, text: 'ZATCA Phase 2 & FTA Compliant' },
  { icon: Globe, text: 'KSA · UAE · Oman (OTA)' },
  { icon: Award, text: 'Real-time Kitchen Display' },
  { icon: Star, text: 'Multi-tenant SaaS Platform' },
]

export default function LoginPage() {
  const router = useRouter()
  const { loginAs } = useAppStore()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'role' | 'credentials'>('role')
  const [error, setError] = useState('')

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    const defaults: Record<UserRole, { email: string; password: string }> = {
      super_admin: { email: 'admin@buysial.com', password: 'superadmin123' },
      admin: { email: 'ahmed@alfanar.com', password: 'admin123' },
      manager: { email: 'sarah@alfanar.com', password: 'manager123' },
      waiter: { email: 'mo@alfanar.com', password: 'waiter123' },
      chef: { email: 'carlos@alfanar.com', password: 'chef123' },
      cashier: { email: 'fatima@alfanar.com', password: 'cashier123' },
    }
    setEmail(defaults[role].email)
    setPassword(defaults[role].password)
    setStep('credentials')
    setError('')
  }

  const handleLogin = async () => {
    if (!selectedRole) return
    if (!email || !password) { setError('Please enter your credentials'); return }
    const roleConfig = ROLES.find(r => r.role === selectedRole)
    if (password !== roleConfig?.password) {
      setError('Incorrect password. Please try again.')
      return
    }
    setIsLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 900))
    loginAs(selectedRole)
    router.push(`/dashboard?role=${selectedRole}`)
  }

  const selectedRoleConfig = ROLES.find(r => r.role === selectedRole)

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">

      {/* LEFT PANEL — Branding */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 relative flex-col justify-between p-12 overflow-hidden shadow-2xl">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            {/* Subtle grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 transition-transform hover:scale-105 duration-500">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <Image src="/logo.png" alt="BuysialPOS" width={38} height={38} className="rounded-xl object-contain" />
            </div>
            <div>
              <div className="text-white font-black text-xl tracking-tight">Buysial ERP</div>
              <div className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Enterprise Edition</div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Restaurant Management
            </span>
          </h1>
          <p className="text-blue-100/80 text-base leading-relaxed max-w-sm font-light">
            Enterprise-grade POS, compliance, analytics and HR — built for the Middle East.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 group transition-all">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all shadow-lg backdrop-blur-sm">
                <Icon className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" />
              </div>
              <span className="text-blue-50/90 text-sm font-medium tracking-wide">{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="border-t border-blue-400/20 pt-6 backdrop-blur-sm">
            <p className="text-blue-200/80 text-sm leading-relaxed font-light italic">
              "Buysial transformed our operations across all 3 branches in Riyadh."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center text-white text-xs font-black shadow-lg">A</div>
              <span className="text-blue-100 text-xs font-semibold tracking-wide">Ahmed Al-Rashidi · Al Fanar</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Image src="/logo.png" alt="BuysialPOS" width={36} height={36} className="rounded-xl object-contain" />
            <span className="text-gray-900 font-black text-lg">Buysial ERP</span>
          </div>

          {step === 'role' ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h2>
                <p className="text-slate-500">Select your role to continue</p>
              </div>

              {/* Role Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {ROLES.map(({ role, label, icon: Icon, desc, gradient, color }) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={cn(
                      'group relative p-4 rounded-2xl border-2 text-left transition-all duration-200',
                      'hover:scale-[1.02] hover:shadow-lg',
                      gradient
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm', color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-gray-900 text-sm font-bold">{label}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                    <ArrowRight className="absolute top-4 right-4 w-3.5 h-3.5 text-slate-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>

              <p className="text-center text-slate-400 text-xs">
                Demo mode — select any role to explore the platform
              </p>
            </>
          ) : (
            <>
              {/* Back */}
              <button
                onClick={() => { setStep('role'); setSelectedRole(null); setError('') }}
                className="flex items-center gap-2 text-slate-500 hover:text-gray-700 text-sm mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to roles
              </button>

              {/* Selected role badge */}
              {selectedRoleConfig && (
                <div className={cn('flex items-center gap-3 p-3 rounded-xl mb-8 border', selectedRoleConfig.gradient)}>
                  <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', selectedRoleConfig.color)}>
                    <selectedRoleConfig.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 text-sm font-bold">{selectedRoleConfig.label}</div>
                    <div className="text-slate-500 text-xs">{selectedRoleConfig.desc}</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-blue-600 ml-auto drop-shadow-sm" />
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Sign in</h2>
                <p className="text-slate-500 text-sm font-medium">Verify your access credentials</p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-gray-900 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 text-gray-900 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-slate-50 focus:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2',
                    isLoading
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0'
                  )}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Security note */}
              <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs">Secured with end-to-end encryption</span>
              </div>
            </>
          )}

          {/* Country flags */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-center gap-4">
            <span className="text-slate-400 text-xs">Compliant with</span>
            {[
              { flag: '🇸🇦', label: 'ZATCA' },
              { flag: '🇦🇪', label: 'FTA' },
              { flag: '🇴🇲', label: 'OTA' },
            ].map(({ flag, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                <span className="text-sm">{flag}</span>
                <span className="text-xs font-semibold text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
