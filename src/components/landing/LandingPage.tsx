'use client'
// BuysialERP Landing Page
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChefHat, Zap, Shield, Globe, BarChart3, QrCode, Smartphone,
  Check, ArrowRight, Star, Menu, X, ChevronDown, Play,
  Building2, Users, Receipt, Clock, TrendingUp, Layers,
  CreditCard, Bell, Lock, Sparkles, Award, MapPin
} from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/mock-data'

export default function LandingPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [annualBilling, setAnnualBilling] = useState(false)

  const handleDemoLogin = (role: string) => {
    router.push(`/dashboard?role=${role}`)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-xl font-bold gradient-text">Buysial ERP</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Pricing', 'Compliance', 'About'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setDemoOpen(true)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-gray-900 transition-colors"
              >
                Book Demo
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-emerald-glow"
              >
                Get Started
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-600">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {['Features', 'Pricing', 'Compliance', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-slate-600 hover:text-gray-900 py-2 text-sm font-medium">
                {item}
              </a>
            ))}
            <button onClick={() => router.push('/dashboard')} className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg">
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="landing-hero pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-50 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-100 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-emerald-700 mb-6 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-amber-500" />
            ZATCA Phase 2 & FTA Compliant — KSA & UAE
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            The Future of
            <span className="gradient-text block">Restaurant Management</span>
          </h1>

          <p className="text-lg md:text-xl text-emerald-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium multi-tenant POS system built for the Middle East. ZATCA/FTA compliant invoicing,
            real-time kitchen display, QR menus, and full HR management — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all hover:shadow-emerald-glow text-base"
            >
              <Zap className="w-5 h-5" />
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold rounded-xl transition-all text-base border border-emerald-200"
            >
              <Play className="w-4 h-4" />
              Book Live Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '500+', label: 'Restaurants', icon: Building2 },
              { value: 'KSA & UAE', label: 'Regions', icon: MapPin },
              { value: '99.9%', label: 'Uptime', icon: Zap },
              { value: 'ZATCA', label: 'Certified', icon: Award },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <stat.icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-900">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards — Demo Access */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Experience Every Role</h2>
            <p className="text-emerald-600">Click any role to enter the live demo dashboard</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { role: 'super_admin', label: 'Super Admin', icon: Shield, color: 'from-purple-600 to-purple-800', desc: 'Platform control' },
              { role: 'admin', label: 'Owner', icon: Building2, color: 'from-gold-600 to-gold-800', desc: 'Full business control' },
              { role: 'manager', label: 'Manager', icon: BarChart3, color: 'from-blue-600 to-blue-800', desc: 'Reports & inventory' },
              { role: 'waiter', label: 'Waiter', icon: Users, color: 'from-cyan-600 to-cyan-800', desc: 'Table ordering' },
              { role: 'chef', label: 'Chef', icon: ChefHat, color: 'from-red-600 to-red-800', desc: 'Kitchen display' },
              { role: 'cashier', label: 'Cashier', icon: Receipt, color: 'from-emerald-600 to-emerald-800', desc: 'Checkout & invoices' },
            ].map(({ role, label, icon: Icon, color, desc }) => (
              <button
                key={role}
                onClick={() => handleDemoLogin(role)}
                className="bg-white rounded-2xl shadow-sm p-4 text-center hover:scale-105 transition-all group border border-gray-200 hover:border-emerald-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3 group-hover:shadow-emerald-glow transition-all`}>
                  <Icon className="w-6 h-6 text-gray-900" />
                </div>
                <div className="font-bold text-gray-900 text-sm">{label}</div>
                <div className="text-xs text-gray-900 mt-1">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-emerald-600 text-lg">Built for the modern Middle Eastern restaurant</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {/* Large feature */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl shadow-sm p-8 border border-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-all" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-4">
                  <Receipt className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">ZATCA Phase 2 Compliant Invoicing</h3>
                <p className="text-emerald-600 leading-relaxed mb-4">
                  Generate fully compliant e-invoices for Saudi Arabia with embedded QR codes, TLV encoding,
                  and automatic 15% VAT calculation. FTA compliant for UAE with 5% VAT.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {['ZATCA QR', 'TLV Encoded', 'PDF Export', 'Thermal Print'].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md border border-gray-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 relative overflow-hidden group hover:border-gold-600/30 transition-all">
              <QrCode className="w-8 h-8 text-amber-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">QR Menu Generator</h3>
              <p className="text-gray-900 text-sm">Logo-branded QR codes with premium PWA customer menu</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 group hover:border-emerald-600/30 transition-all">
              <Smartphone className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Mobile-First POS</h3>
              <p className="text-gray-900 text-sm">Optimized tablet/phone interface for waiters & cashiers</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 group hover:border-red-600/30 transition-all">
              <ChefHat className="w-8 h-8 text-red-400 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Kitchen Display System</h3>
              <p className="text-gray-900 text-sm">Real-time KDS with order priority and elapsed timers</p>
            </div>

            <div className="md:col-span-2 bg-white rounded-3xl shadow-sm p-6 border border-gray-200 flex items-start gap-6 group hover:border-blue-600/30 transition-all">
              <div>
                <BarChart3 className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-900 text-sm">Revenue trends, subscription growth, and platform-wide insights with Recharts</p>
              </div>
              <div>
                <Users className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">HR & Attendance</h3>
                <p className="text-gray-900 text-sm">Clock-in/out tracking with automated payroll calculation</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 group hover:border-purple-600/30 transition-all">
              <Globe className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Full RTL Arabic</h3>
              <p className="text-gray-900 text-sm">Complete Arabic interface with automatic RTL layout switching</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 group hover:border-emerald-600/30 transition-all">
              <Layers className="w-8 h-8 text-emerald-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Multi-Tenant</h3>
              <p className="text-gray-900 text-sm">Isolated data per restaurant with shared infrastructure</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200 group hover:border-gold-600/30 transition-all">
              <Bell className="w-8 h-8 text-amber-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Real-Time Sync</h3>
              <p className="text-gray-900 text-sm">WebSocket-powered live order updates across all stations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section id="compliance" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Built for the Region</h2>
            <p className="text-emerald-600">Full compliance with KSA & UAE tax regulations</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                country: '🇸🇦 Saudi Arabia',
                badge: 'ZATCA Phase 2',
                color: 'border-emerald-600/40',
                glowColor: 'bg-emerald-50',
                features: ['15% VAT (Default)', 'ZATCA QR Code in invoices', 'TLV-encoded e-invoice data', 'Hijri calendar support', 'Arabic (RTL) interface', 'SAR currency formatting'],
              },
              {
                country: '🇦🇪 United Arab Emirates',
                badge: 'FTA Compliant',
                color: 'border-gold-600/40',
                glowColor: 'bg-amber-100',
                features: ['5% VAT (Default)', 'FTA-compliant invoicing', 'Tax registration number', 'AED currency formatting', 'Dubai/Abu Dhabi localization', 'Arabic (RTL) interface'],
              },
            ].map(item => (
              <div key={item.country} className={`bg-white rounded-3xl shadow-sm p-8 border ${item.color} relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-48 h-48 ${item.glowColor} rounded-full blur-3xl`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{item.country}</h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                      {item.badge}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {item.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm text-emerald-700">
                        <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-emerald-600 mb-6">No hidden fees. Cancel anytime.</p>
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-4 py-2">
              <span className={`text-sm font-medium ${!annualBilling ? 'text-gray-900' : 'text-gray-900'}`}>Monthly</span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`relative w-12 h-6 rounded-full transition-colors ${annualBilling ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${annualBilling ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${annualBilling ? 'text-gray-900' : 'text-gray-900'}`}>
                Annual <span className="text-amber-500">-20%</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl shadow-sm p-8 border transition-all relative ${
                  plan.isPopular
                    ? 'border-emerald-500/50 shadow-emerald-glow scale-105'
                    : 'border-gray-100 hover:border-emerald-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="font-bold text-gray-900">
                    ${annualBilling ? Math.round(plan.price * 0.8) : plan.price}
                  </span>
                  <span className="text-gray-900 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-emerald-700">
                      <Check className="w-4 h-4 text-gray-900 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/dashboard')}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.isPopular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-glow'
                      : 'glass hover:bg-emerald-50 text-emerald-700 border border-gray-200'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Loved by Restaurant Owners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ahmed Al-Rashidi', role: 'Owner, Al Fanar Restaurant, Riyadh', text: 'The ZATCA compliance feature saved us weeks of manual work. The Arabic interface is flawless.', rating: 5 },
              { name: 'Khalid Al-Mansoori', role: 'GM, Burj Bites, Dubai', text: 'Switched from our old system in 2 days. The KDS integration transformed our kitchen operations.', rating: 5 },
              { name: 'Sarah Johnson', role: 'Operations Manager, Najd Village', text: 'The QR menu feature doubled our table turnover. Customers love the premium ordering experience.', rating: 5 },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className="text-emerald-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-emerald-600 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-sm p-12 border border-emerald-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-amber-50 pointer-events-none" />
            <div className="relative z-10">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-gray-900 mb-4">Ready to Transform Your Restaurant?</h2>
              <p className="text-emerald-600 mb-8">Join 500+ restaurants across KSA and UAE on Buysial ERP</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all hover:shadow-emerald-glow flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold rounded-xl transition-all border border-emerald-200"
                >
                  Book a Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-gray-900" />
                </div>
                <span className="font-bold text-gray-900">Buysial ERP</span>
              </div>
              <p className="text-emerald-600 text-sm">Premium Restaurant Management for KSA & UAE</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { title: 'Compliance', links: ['ZATCA Phase 2', 'FTA UAE', 'VAT Guide', 'Security'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-emerald-600 hover:text-emerald-600 text-sm transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-emerald-700 text-sm">© 2024 Buysial ERP. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-emerald-700 hover:text-emerald-600 text-sm">Privacy</a>
              <a href="#" className="text-emerald-700 hover:text-emerald-600 text-sm">Terms</a>
              <a href="#" className="text-emerald-700 hover:text-emerald-600 text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDemoOpen(false)} />
          <div className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-md relative z-10 border border-emerald-200">
            <button onClick={() => setDemoOpen(false)} className="absolute top-4 right-4 text-gray-900 hover:text-emerald-700">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Book a Live Demo</h2>
            <p className="text-emerald-600 text-sm mb-6">Or jump in as any role right now</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { role: 'super_admin', label: 'Super Admin', icon: '🛡️' },
                { role: 'admin', label: 'Admin/Owner', icon: '🏪' },
                { role: 'manager', label: 'Manager', icon: '📊' },
                { role: 'waiter', label: 'Waiter', icon: '🛎️' },
                { role: 'chef', label: 'Chef/KDS', icon: '👨‍🍳' },
                { role: 'cashier', label: 'Cashier', icon: '💳' },
              ].map(r => (
                <button
                  key={r.role}
                  onClick={() => handleDemoLogin(r.role)}
                  className="bg-white rounded-xl shadow-sm p-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-all border border-gray-100 hover:border-emerald-300 flex items-center gap-2"
                >
                  <span>{r.icon}</span>{r.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-white rounded-xl shadow-sm text-sm text-gray-900 placeholder-emerald-600 border border-gray-200 focus:border-emerald-600 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Work Email"
                className="w-full px-4 py-3 bg-white rounded-xl shadow-sm text-sm text-gray-900 placeholder-emerald-600 border border-gray-200 focus:border-emerald-600 focus:outline-none"
              />
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all">
                Request Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
