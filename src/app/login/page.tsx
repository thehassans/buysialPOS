'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { UserRole } from '@/lib/types'
import Image from 'next/image'
import {
  ChefHat, Shield, Building2, BarChart3, Receipt, Users,
  Eye, EyeOff, ArrowRight, Lock, Zap, Globe, Award, Star,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_ROLES: { role: UserRole; label: string; icon: any; email: string; password: string; color: string }[] = [
  { role: 'super_admin', label: 'Super Admin',  icon: Shield,    email: 'admin@buysial.com',   password: 'superadmin123', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { role: 'admin',       label: 'Admin',         icon: Building2, email: 'ahmed@alfanar.com',   password: 'admin123',      color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { role: 'manager',     label: 'Manager',       icon: BarChart3, email: 'sarah@alfanar.com',   password: 'manager123',    color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { role: 'waiter',      label: 'Waiter',        icon: Users,     email: 'mo@alfanar.com',      password: 'waiter123',     color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { role: 'chef',        label: 'Chef',          icon: ChefHat,   email: 'carlos@alfanar.com',  password: 'chef123',       color: 'bg-red-100 text-red-700 border-red-200' },
  { role: 'cashier',     label: 'Cashier',       icon: Receipt,   email: 'fatima@alfanar.com',  password: 'cashier123',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
]

const FEATURES = [
  { icon: Zap,   text: 'ZATCA Phase 2 & FTA Compliant' },
  { icon: Globe, text: 'KSA · UAE · Oman (OTA)' },
  { icon: Award, text: 'Real-time Kitchen Display' },
  { icon: Star,  text: 'Multi-tenant SaaS Platform' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAppStore()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState('')
  const [showDemo, setShowDemo]     = useState(false)

  const fillDemo = (role: (typeof DEMO_ROLES)[0]) => {
    setEmail(role.email)
    setPassword(role.password)
    setShowDemo(false)
    setError('')
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setIsLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 600))
    const result = login(email.trim(), password)
    setIsLoading(false)
    if (!result.success) { setError(result.error || 'Login failed'); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-900 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Image src="/logo.png" alt="BuysialPOS" width={44} height={44} className="rounded-2xl object-contain" />
            <div>
              <div className="text-white font-black text-xl tracking-tight">Buysial ERP</div>
              <div className="text-emerald-400 text-xs font-medium">Restaurant Intelligence Platform</div>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            The Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Restaurant Management</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Enterprise-grade POS, compliance, analytics and HR — built for the Middle East.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-gray-300 text-sm">{text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-gray-500 text-xs leading-relaxed">"Buysial transformed our operations across all 3 branches in Riyadh."</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[10px] font-bold">A</div>
            <span className="text-gray-400 text-xs">Ahmed Al-Rashidi · Al Fanar Restaurant</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Image src="/logo.png" alt="BuysialPOS" width={36} height={36} className="rounded-xl object-contain" />
            <span className="text-gray-900 font-black text-lg">Buysial ERP</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in with your account credentials</p>
          </div>

          {/* Login form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 text-gray-900 text-sm placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                'w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2',
                isLoading
                  ? 'bg-emerald-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0'
              )}
            >
              {isLoading ? (
                <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</>
              ) : (
                <>Sign in to Dashboard<ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Quick Demo Access */}
          <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-slate-600"
            >
              <span>⚡ Quick Demo Access</span>
              {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showDemo && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-white">
                {DEMO_ROLES.map(role => {
                  const Icon = role.icon
                  return (
                    <button
                      key={role.role}
                      onClick={() => fillDemo(role)}
                      className={cn('flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105', role.color)}
                    >
                      <Icon className="w-4 h-4" />
                      {role.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs">Secured with end-to-end encryption</span>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-4">
            <span className="text-slate-400 text-xs">Compliant with</span>
            {[{ flag: '🇸🇦', label: 'ZATCA' }, { flag: '🇦🇪', label: 'FTA' }, { flag: '🇴🇲', label: 'OTA' }].map(({ flag, label }) => (
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
