'use client'

import { useState, useRef } from 'react'
import QRCode from 'qrcode'
import { useAppStore } from '@/store/app-store'
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { QrCode, Download, Eye, ExternalLink, Sparkles, Copy, Check } from 'lucide-react'

export default function QRMenuModule() {
  const { currentTenant } = useAppStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrGenerated, setQrGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [frame, setFrame] = useState<'branded' | 'minimal' | 'none'>('branded')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [fgColor, setFgColor] = useState('#059669')

  if (!currentTenant) return null

  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${encodeURIComponent(currentTenant.slug)}?${new URLSearchParams({
    tenantId: currentTenant.id,
    name: currentTenant.name,
    countryCode: currentTenant.countryCode,
    currency: currentTenant.currency,
    vatRate: String(currentTenant.vatRate),
    email: currentTenant.email,
    phone: currentTenant.phone,
    address: currentTenant.address,
    vatNumber: currentTenant.vatNumber || '',
    primaryColor: currentTenant.primaryColor || '#059669',
    invoiceFooter: currentTenant.invoiceFooter || '',
    logo: currentTenant.logo || '/logo.png',
  }).toString()}`

  const generateQR = async () => {
    if (!canvasRef.current) return
    setGenerating(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const padding = 20
      const qrSize = 280
      const headerHeight = frame === 'branded' ? 70 : 0
      const footerHeight = frame === 'branded' ? 60 : 0
      const totalWidth = qrSize + padding * 2
      const totalHeight = qrSize + padding * 2 + headerHeight + footerHeight

      canvas.width = totalWidth
      canvas.height = totalHeight

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, totalWidth, totalHeight)

      const radius = 12

      if (frame === 'branded') {
        ctx.fillStyle = fgColor
        ctx.beginPath()
        ctx.moveTo(radius, 0)
        ctx.lineTo(totalWidth - radius, 0)
        ctx.arcTo(totalWidth, 0, totalWidth, radius, radius)
        ctx.lineTo(totalWidth, headerHeight)
        ctx.lineTo(0, headerHeight)
        ctx.lineTo(0, radius)
        ctx.arcTo(0, 0, radius, 0, radius)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(currentTenant.name, totalWidth / 2, headerHeight / 2 - 6)
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fillText(currentTenant.countryCode === 'KSA' ? '🇸🇦 Saudi Arabia' : '🇦🇪 UAE', totalWidth / 2, headerHeight / 2 + 14)
      }

      if (frame === 'branded') {
        ctx.fillStyle = fgColor
        ctx.beginPath()
        ctx.moveTo(0, totalHeight - footerHeight)
        ctx.lineTo(totalWidth, totalHeight - footerHeight)
        ctx.lineTo(totalWidth, totalHeight - radius)
        ctx.arcTo(totalWidth, totalHeight, totalWidth - radius, totalHeight, radius)
        ctx.lineTo(radius, totalHeight)
        ctx.arcTo(0, totalHeight, 0, totalHeight - radius, radius)
        ctx.lineTo(0, totalHeight - footerHeight)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('📱 Scan to View Our Menu', totalWidth / 2, totalHeight - footerHeight / 2)
      }

      const qrDataURL = await QRCode.toDataURL(menuUrl, {
        width: qrSize,
        margin: 1,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: 'M',
      })

      const img = new Image()
      img.onload = () => {
        const qrY = headerHeight + padding
        ctx.drawImage(img, padding, qrY, qrSize, qrSize)
        const dataUrl = canvas.toDataURL('image/png')
        setQrDataUrl(dataUrl)
        setQrGenerated(true)
        setGenerating(false)
      }
      img.src = qrDataURL
    } catch (err) {
      console.error('QR generation failed:', err)
      setGenerating(false)
    }
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `${currentTenant.slug}-qr-menu.png`
    link.href = qrDataUrl
    link.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">QR Menu Generator</h2>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-emerald-200 text-emerald-600 text-sm font-medium rounded-xl transition-all"
        >
          <Eye className="w-4 h-4" /> Preview Menu
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 space-y-4">
            <h3 className="text-gray-900 font-semibold text-sm">QR Style</h3>

            <div className="space-y-2">
              <label className="text-emerald-500 text-xs font-medium">Frame Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'branded', label: 'Branded', desc: 'Logo + CTA' },
                  { id: 'minimal', label: 'Minimal', desc: 'Clean' },
                  { id: 'none', label: 'None', desc: 'QR only' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFrame(f.id as typeof frame)}
                    className={cn(
                      'p-3 rounded-xl text-center border transition-all',
                      frame === f.id ? 'border-emerald-500 bg-emerald-50' : 'bg-gray-50 border-gray-200 hover:border-emerald-300'
                    )}
                  >
                    <div className="text-gray-900 text-xs font-medium">{f.label}</div>
                    <div className="text-slate-500 text-[10px]">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-emerald-500 text-xs font-medium block mb-1">Foreground</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer bg-transparent"
                  />
                  <span className="text-emerald-600 text-xs font-mono">{fgColor}</span>
                </div>
              </div>
              <div>
                <label className="text-emerald-500 text-xs font-medium block mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer bg-transparent"
                  />
                  <span className="text-emerald-600 text-xs font-mono">{bgColor}</span>
                </div>
              </div>
            </div>

            <button
              onClick={generateQR}
              className={cn('w-full py-3 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2', generating ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white')}
            >
              <QrCode className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 space-y-3">
            <h3 className="text-gray-900 font-semibold text-sm">Menu Link</h3>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
              <span className="flex-1 text-emerald-600 text-xs font-mono truncate">{menuUrl}</span>
              <button onClick={copyLink} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg text-xs text-emerald-600 border border-gray-200 hover:text-emerald-700 flex-shrink-0">
                {copied ? <><Check className="w-3 h-3 text-emerald-600" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>

          {qrGenerated && (
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 space-y-3">
              <h3 className="text-gray-900 font-semibold text-sm">Download</h3>
              <button
                onClick={downloadQR}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 rounded-xl text-sm text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all font-medium"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
            </div>
          )}
        </div>

        {/* QR Preview */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 flex flex-col items-center justify-center min-h-80">
          <canvas ref={canvasRef} className="hidden" />
          {!qrGenerated ? (
            <div className="text-center space-y-4">
              <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto bg-gray-50">
                <QrCode className="w-16 h-16 text-slate-300" />
              </div>
              <div>
                <p className="text-gray-700 text-sm font-medium">Configure and generate your QR code</p>
                <p className="text-slate-400 text-xs mt-1">Encodes the live menu URL — fully scannable</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="rounded-2xl shadow-lg border border-gray-100"
                  style={{ maxWidth: '320px', width: '100%' }}
                />
              )}
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <Sparkles className="w-3.5 h-3.5" />
                Ready to print & share
              </div>
              <p className="text-xs text-slate-400 text-center">Scan with any camera app to open the menu</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Preview Stats */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
        <h3 className="text-gray-900 font-semibold text-sm mb-4">Menu Content Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Categories', value: MOCK_CATEGORIES.length },
            { label: 'Menu Items', value: MOCK_MENU_ITEMS.length },
            { label: 'Popular Items', value: MOCK_MENU_ITEMS.filter(i => i.isPopular).length },
            { label: 'New Items', value: MOCK_MENU_ITEMS.filter(i => i.isNew).length },
          ].map(stat => (
            <div key={stat.label} className="text-center p-3 bg-emerald-50 rounded-xl">
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-slate-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
