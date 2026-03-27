'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import Image from 'next/image'
import {
  ArrowRight, Eye, EyeOff, Globe, Lock, MonitorSmartphone, ShieldCheck, Sparkles, Store
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: ShieldCheck, text: 'Secure tenant and platform access' },
  { icon: Globe, text: 'KSA · UAE · Oman (OTA)' },
  { icon: MonitorSmartphone, text: 'Optimized for desktop and mobile operations' },
  { icon: Sparkles, text: 'Multi-tenant restaurant operating system' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, initPlatformData, setCurrentUser, setCurrentTenant, setActiveView, setLanguage } = useAppStore()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    initPlatformData()
  }, [initPlatformData])

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setIsLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 300))
    const result = login(email.trim(), password)
    if (!result.success) {
      try {
        const res = await fetch('/api/platform-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        })
        const data = await res.json()
        if (res.ok && data?.user && data?.tenant) {
          setCurrentUser({ ...data.user, createdAt: new Date(data.user.createdAt) })
          setCurrentTenant({
            ...data.tenant,
            createdAt: new Date(data.tenant.createdAt),
            validUntil: data.tenant.validUntil ? new Date(data.tenant.validUntil) : undefined,
          })
          setLanguage(data.user.language || 'en')
          setActiveView('dashboard')
          setIsLoading(false)
          router.push('/dashboard')
          return
        }
        const preferPlatformError = Boolean(data?.isPlatformUser) || res.status === 503 || (result.error || '').toLowerCase().includes('platform')
        setIsLoading(false)
        setError(preferPlatformError ? (data?.error || 'Platform login failed') : (result.error || data?.error || 'Login failed'))
        return
      } catch {
        setIsLoading(false)
        setError(result.error || 'Login failed')
        return
      }
    }
    setIsLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f7f9f8] overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(160deg,#04110d_0%,#081a15_40%,#0d1513_100%)] p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mb-12 flex items-center gap-4">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              <Image src="/buysialposlogo.png" alt="BuysialPOS" width={58} height={58} className="object-contain" priority />
            </div>
            <div>
              <div className="text-white font-black text-2xl tracking-tight">Buysial ERP</div>
              <div className="text-emerald-300 text-xs font-medium uppercase tracking-[0.28em]">Restaurant intelligence platform</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Premium operations suite
          </div>
          <h1 className="mt-6 text-5xl font-black leading-[1.02] text-white">
            Control every
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">restaurant moment</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300">
            One secure workspace for platform leadership, front-of-house, kitchen, cashier, analytics, compliance, and multi-branch visibility.
          </p>
        </div>

        <div className="relative z-10 grid gap-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                <Icon className="h-4 w-4 text-emerald-300" />
              </div>
              <span className="text-sm text-gray-200">{text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Trusted in live restaurant environments</div>
              <div className="text-xs text-gray-400">POS, KDS, cashier, reporting, and tenant operations in one flow</div>
            </div>
          </div>
        </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
                <div className="mb-8 flex items-center gap-3 lg:hidden">
                  <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <Image src="/buysialposlogo.png" alt="BuysialPOS" width={42} height={42} className="object-contain" priority />
                  </div>
                  <div>
                    <div className="text-gray-900 font-black text-xl">Buysial ERP</div>
                    <div className="text-slate-500 text-xs uppercase tracking-[0.22em]">Secure access</div>
                  </div>
                </div>

                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <Lock className="h-3.5 w-3.5" />
                  Encrypted access
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950">Welcome back</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                  Sign in with your tenant credentials or your super admin environment credentials.
                </p>
              </div>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-gray-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="name@restaurant.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all',
                      isLoading
                        ? 'cursor-not-allowed bg-emerald-400 text-white'
                        : 'bg-gray-950 text-white shadow-[0_20px_45px_rgba(17,24,39,0.16)] hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0'
                    )}
                  >
                    {isLoading ? (
                      <><svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Authenticating...</>
                    ) : (
                      <>Continue to workspace <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Platform', value: 'Super Admin', icon: ShieldCheck },
                    { label: 'Operations', value: 'POS · Kitchen · Cashier', icon: MonitorSmartphone },
                    { label: 'Coverage', value: 'Mobile responsive', icon: Globe },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Super admin credentials are read from environment variables.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
