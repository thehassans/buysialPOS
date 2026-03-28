'use client'

import { useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useAppStore } from '@/store/app-store'
import { MOCK_MENU_ITEMS } from '@/lib/mock-data'
import { cn, getInitials, getReadableTextColor, mixHexColors, normalizeHexColor, withAlpha } from '@/lib/utils'
import TenantBrandMark from '@/components/shared/TenantBrandMark'
import { BadgeCheck, Check, Copy, Crown, Download, ExternalLink, Eye, Palette, QrCode, Sparkles, Store } from 'lucide-react'

const QR_STYLE_OPTIONS = [
  { id: 'signature', label: 'Signature', desc: 'Ultra premium framed card' },
  { id: 'minimal', label: 'Minimal', desc: 'Luxury clean balance' },
  { id: 'pure', label: 'Pure', desc: 'Print-first composition' },
] as const

type FrameStyle = (typeof QR_STYLE_OPTIONS)[number]['id']

function drawRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + safeRadius, safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.arcTo(x + width, y + height, x + width - safeRadius, y + height, safeRadius)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.arcTo(x, y + height, x, y + height - safeRadius, safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.arcTo(x, y, x + safeRadius, y, safeRadius)
  ctx.closePath()
}

function fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fillStyle: string | CanvasGradient) {
  drawRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = fillStyle
  ctx.fill()
}

function strokeRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, strokeStyle: string, lineWidth = 1) {
  drawRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = strokeStyle
  ctx.stroke()
}

function loadImageAsset(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    if (!src.startsWith('data:')) {
      image.crossOrigin = 'anonymous'
    }
    image.src = src
  })
}

async function drawCenterBadge(ctx: CanvasRenderingContext2D, {
  logo,
  name,
  x,
  y,
  size,
  accentColor,
}: {
  logo?: string
  name: string
  x: number
  y: number
  size: number
  accentColor: string
}) {
  const radius = Math.round(size * 0.28)
  ctx.save()
  ctx.shadowColor = withAlpha('#0f172a', 0.18)
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 10
  fillRoundedRect(ctx, x, y, size, size, radius, '#ffffff')
  ctx.restore()
  strokeRoundedRect(ctx, x, y, size, size, radius, withAlpha(accentColor, 0.16), 1.5)

  const contentSize = size * 0.62
  const contentX = x + (size - contentSize) / 2
  const contentY = y + (size - contentSize) / 2

  if (logo) {
    try {
      const logoImage = await loadImageAsset(logo)
      ctx.drawImage(logoImage, contentX, contentY, contentSize, contentSize)
      return
    } catch {
    }
  }

  ctx.fillStyle = accentColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(size * 0.24)}px Inter, system-ui, sans-serif`
  ctx.fillText(getInitials(name), x + size / 2, y + size / 2 + 1)
}

export default function QRMenuModule() {
  const { currentTenant, categories, menuItems } = useAppStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrGenerated, setQrGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [frame, setFrame] = useState<FrameStyle>('signature')
  const [bgColor, setBgColor] = useState('#f8fafc')
  const [fgColor, setFgColor] = useState(currentTenant?.primaryColor || '#111827')

  if (!currentTenant) return null

  const tenantMenuItems = menuItems.filter(item => item.tenantId === currentTenant.id)
  const fallbackTenantMenuItems = MOCK_MENU_ITEMS.filter(item => item.tenantId === currentTenant.id)
  const scopedMenuItems = tenantMenuItems.length > 0 ? tenantMenuItems : fallbackTenantMenuItems
  const scopedStoredCategories = categories
    .filter(category => category.tenantId === currentTenant.id)
    .filter(category => scopedMenuItems.some(item => item.categoryId === category.id))
  const scopedCategories = scopedStoredCategories.length > 0
    ? scopedStoredCategories
    : Array.from(new Set(scopedMenuItems.map(item => item.categoryId).filter(Boolean))).map((categoryId, index) => ({
      id: categoryId,
      tenantId: currentTenant.id,
      name: categoryId.replace(/[-_]/g, ' ').replace(/\b\w/g, character => character.toUpperCase()),
      nameAr: undefined,
      icon: ['🍽️', '🥗', '🥘', '🍰', '🥤'][index % 5],
      sortOrder: index + 1,
      isActive: true,
    }))

  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${encodeURIComponent(currentTenant.slug)}`
  const tenantBrandColor = normalizeHexColor(currentTenant.primaryColor)
  const navigationColor = normalizeHexColor(currentTenant.secondaryColor || mixHexColors(tenantBrandColor, '#0f172a', 0.3), '#0f766e')
  const qrAccentColor = normalizeHexColor(fgColor, tenantBrandColor)
  const canvasBackground = normalizeHexColor(bgColor, '#f8fafc')
  const styleMeta = QR_STYLE_OPTIONS.find(option => option.id === frame) || QR_STYLE_OPTIONS[0]
  const previewBadgeColor = mixHexColors(tenantBrandColor, navigationColor, 0.36)
  const previewBadgeText = getReadableTextColor(previewBadgeColor)
  const countryLabel = currentTenant.countryCode === 'KSA' ? 'Saudi Arabia' : currentTenant.countryCode === 'UAE' ? 'United Arab Emirates' : 'Oman'
  const hostLabel = typeof window !== 'undefined' ? new URL(menuUrl).hostname.replace(/^www\./, '') : `${currentTenant.slug}.menu`
  const availableItems = scopedMenuItems.filter(item => item.isAvailable).length

  const generateQR = async () => {
    if (!canvasRef.current) return
    setGenerating(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const qrSize = frame === 'signature' ? 360 : frame === 'minimal' ? 328 : 300
      const qrShellPadding = frame === 'pure' ? 18 : 24
      const headerHeight = frame === 'signature' ? 120 : frame === 'minimal' ? 86 : 62
      const footerHeight = frame === 'signature' ? 88 : frame === 'minimal' ? 68 : 58
      const panelMargin = 14
      const qrPanelSize = qrSize + qrShellPadding * 2
      const totalWidth = qrPanelSize + panelMargin * 2 + 24
      const totalHeight = headerHeight + qrPanelSize + footerHeight + panelMargin * 2 + 24
      const scale = 2

      canvas.width = totalWidth * scale
      canvas.height = totalHeight * scale
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.clearRect(0, 0, totalWidth, totalHeight)

      ctx.fillStyle = canvasBackground
      ctx.fillRect(0, 0, totalWidth, totalHeight)

      const cardX = panelMargin
      const cardY = panelMargin
      const cardWidth = totalWidth - panelMargin * 2
      const cardHeight = totalHeight - panelMargin * 2

      ctx.save()
      ctx.shadowColor = withAlpha('#0f172a', 0.12)
      ctx.shadowBlur = 34
      ctx.shadowOffsetY = 16
      fillRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 34, '#ffffff')
      ctx.restore()
      strokeRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 34, withAlpha(navigationColor, 0.1), 1.2)

      if (frame === 'signature') {
        const headerGradient = ctx.createLinearGradient(cardX + 20, cardY + 20, cardX + cardWidth - 20, cardY + headerHeight)
        headerGradient.addColorStop(0, tenantBrandColor)
        headerGradient.addColorStop(1, mixHexColors(navigationColor, '#0f172a', 0.18))
        fillRoundedRect(ctx, cardX + 18, cardY + 18, cardWidth - 36, 86, 28, headerGradient)
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.font = '700 22px Inter, system-ui, sans-serif'
        ctx.fillText(currentTenant.name, cardX + 40, cardY + 42)
        ctx.font = '500 12px Inter, system-ui, sans-serif'
        ctx.fillStyle = withAlpha('#ffffff', 0.78)
        ctx.fillText(`${countryLabel} • Live Digital Menu`, cardX + 40, cardY + 72)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.font = '700 11px Inter, system-ui, sans-serif'
        ctx.fillText('SCAN TO OPEN', cardX + cardWidth - 40, cardY + 46)
        ctx.fillStyle = withAlpha('#ffffff', 0.72)
        ctx.font = '500 11px Inter, system-ui, sans-serif'
        ctx.fillText(hostLabel, cardX + cardWidth - 40, cardY + 70)
      } else {
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#0f172a'
        ctx.font = '700 20px Inter, system-ui, sans-serif'
        ctx.fillText(currentTenant.name, cardX + 26, cardY + 28)
        ctx.fillStyle = withAlpha('#0f172a', 0.64)
        ctx.font = '500 12px Inter, system-ui, sans-serif'
        ctx.fillText(frame === 'minimal' ? 'Signature logo-centered QR menu' : 'Premium print-ready QR menu', cardX + 26, cardY + 58)
        ctx.textAlign = 'right'
        ctx.fillStyle = withAlpha(navigationColor, 0.84)
        ctx.font = '700 11px Inter, system-ui, sans-serif'
        ctx.fillText(hostLabel, cardX + cardWidth - 26, cardY + 34)
      }

      const qrPanelX = (totalWidth - qrPanelSize) / 2
      const qrPanelY = cardY + headerHeight + 8
      fillRoundedRect(ctx, qrPanelX, qrPanelY, qrPanelSize, qrPanelSize, 30, '#ffffff')
      strokeRoundedRect(ctx, qrPanelX, qrPanelY, qrPanelSize, qrPanelSize, 30, withAlpha(tenantBrandColor, 0.1), 1)

      const qrDataURL = await QRCode.toDataURL(menuUrl, {
        width: qrSize,
        margin: 1,
        color: { dark: qrAccentColor, light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })

      const qrImage = await loadImageAsset(qrDataURL)
      const qrX = qrPanelX + qrShellPadding
      const qrY = qrPanelY + qrShellPadding
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

      const badgeSize = frame === 'signature' ? 84 : 76
      await drawCenterBadge(ctx, {
        logo: currentTenant.logo,
        name: currentTenant.name,
        x: qrX + qrSize / 2 - badgeSize / 2,
        y: qrY + qrSize / 2 - badgeSize / 2,
        size: badgeSize,
        accentColor: tenantBrandColor,
      })

      const footerTop = qrPanelY + qrPanelSize + 24
      ctx.textBaseline = 'top'
      if (frame === 'signature') {
        ctx.textAlign = 'left'
        ctx.fillStyle = '#0f172a'
        ctx.font = '700 12px Inter, system-ui, sans-serif'
        ctx.fillText('Scan to browse the live menu', cardX + 28, footerTop)
        ctx.fillStyle = withAlpha('#0f172a', 0.58)
        ctx.font = '500 11px Inter, system-ui, sans-serif'
        ctx.fillText(`${scopedCategories.length} categories • ${availableItems} available items`, cardX + 28, footerTop + 20)
        ctx.textAlign = 'right'
        ctx.fillStyle = navigationColor
        ctx.font = '700 12px Inter, system-ui, sans-serif'
        ctx.fillText(hostLabel, cardX + cardWidth - 28, footerTop)
        ctx.fillStyle = withAlpha('#0f172a', 0.58)
        ctx.font = '500 11px Inter, system-ui, sans-serif'
        ctx.fillText('Logo badge on white background', cardX + cardWidth - 28, footerTop + 20)
      } else {
        ctx.textAlign = 'center'
        ctx.fillStyle = '#0f172a'
        ctx.font = '700 12px Inter, system-ui, sans-serif'
        ctx.fillText('Scan with any camera to open the menu', totalWidth / 2, footerTop)
        ctx.fillStyle = withAlpha('#0f172a', 0.58)
        ctx.font = '500 11px Inter, system-ui, sans-serif'
        ctx.fillText(hostLabel, totalWidth / 2, footerTop + 20)
      }

      const dataUrl = canvas.toDataURL('image/png')
      setQrDataUrl(dataUrl)
      setQrGenerated(true)
    } catch (err) {
      console.error('QR generation failed:', err)
    } finally {
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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Unable to copy menu link', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
            <Crown className="w-3.5 h-3.5" /> Premium QR Experience
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">QR Menu Generator</h2>
            <p className="text-sm text-slate-500 mt-1">Ultra minimalist presentation with a centered restaurant logo badge and print-ready QR output.</p>
          </div>
        </div>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-emerald-200 text-emerald-600 text-sm font-medium rounded-2xl transition-all shadow-sm"
        >
          <Eye className="w-4 h-4" /> Preview Menu
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div
              className="p-6 border-b border-slate-100"
              style={{
                background: `linear-gradient(135deg, ${mixHexColors(tenantBrandColor, '#ffffff', 0.92)} 0%, ${mixHexColors(navigationColor, '#ffffff', 0.88)} 100%)`,
              }}
            >
              <div className="flex items-start gap-4">
                <TenantBrandMark
                  logo={currentTenant.logo}
                  name={currentTenant.name}
                  className="w-14 h-14 rounded-[20px] shrink-0"
                  initialsClassName="text-base"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Restaurant Identity</div>
                      <h3 className="text-lg font-semibold text-slate-900 mt-1 truncate">{currentTenant.name}</h3>
                    </div>
                    <div className="rounded-full px-3 py-1 text-[11px] font-semibold border" style={{ backgroundColor: withAlpha(previewBadgeColor, 0.12), color: previewBadgeColor, borderColor: withAlpha(previewBadgeColor, 0.18) }}>
                      {styleMeta.label}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{styleMeta.desc} with a white logo badge positioned at the heart of the QR.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Store className="w-4 h-4 text-emerald-600" /> QR Style
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {QR_STYLE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setFrame(option.id)}
                      className={cn(
                        'rounded-2xl border p-3 text-left transition-all',
                        frame === option.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
                      )}
                    >
                      <div className="text-sm font-semibold text-slate-900">{option.label}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Palette className="w-4 h-4 text-emerald-600" /> Brand Palette
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">QR Ink</div>
                      <div className="text-sm text-slate-900 mt-1">Primary scan color</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={e => setFgColor(e.target.value)}
                        className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-600">{normalizeHexColor(fgColor)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Canvas</div>
                      <div className="text-sm text-slate-900 mt-1">Outer presentation tone</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        className="w-11 h-11 rounded-xl border border-gray-200 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-slate-600">{normalizeHexColor(bgColor, '#f8fafc')}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Brand', ink: tenantBrandColor, canvas: '#f8fafc' },
                    { label: 'Monochrome', ink: '#111827', canvas: '#ffffff' },
                    { label: 'Luxe', ink: navigationColor, canvas: '#f5efe6' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setFgColor(preset.ink)
                        setBgColor(preset.canvas)
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-emerald-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={generateQR}
                  className={cn(
                    'w-full py-3 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm',
                    generating ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  <QrCode className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Generate QR'}
                </button>
                <button
                  onClick={downloadQR}
                  disabled={!qrGenerated}
                  className={cn(
                    'w-full py-3 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 border',
                    qrGenerated ? 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  )}
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[26px] shadow-sm p-5 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-gray-900 font-semibold text-sm">Menu Link</h3>
              <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold border" style={{ backgroundColor: withAlpha(previewBadgeColor, 0.12), color: previewBadgeText, borderColor: withAlpha(previewBadgeColor, 0.16) }}>
                Live URL
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="flex-1 text-emerald-700 text-xs font-mono truncate">{menuUrl}</span>
              <button onClick={copyLink} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl text-xs text-emerald-600 border border-gray-200 hover:text-emerald-700 flex-shrink-0">
                {copied ? <><Check className="w-3 h-3 text-emerald-600" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[26px] shadow-sm p-5 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <BadgeCheck className="w-4 h-4 text-emerald-600" /> Premium Output
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Center logo badge</span>
                <span className="font-semibold text-slate-900">White background</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Error correction</span>
                <span className="font-semibold text-slate-900">High</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Style mode</span>
                <span className="font-semibold text-slate-900">{styleMeta.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Preview */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-[32px] shadow-[0_26px_90px_rgba(15,23,42,0.08)] p-6 border border-slate-200 flex flex-col min-h-80">
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preview</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">{styleMeta.label} composition</div>
            </div>
            <div className="rounded-full px-3 py-1 text-[11px] font-semibold border" style={{ backgroundColor: withAlpha(previewBadgeColor, 0.12), color: previewBadgeColor, borderColor: withAlpha(previewBadgeColor, 0.16) }}>
              {qrGenerated ? 'Ready to print' : 'Awaiting generation'}
            </div>
          </div>
          {!qrGenerated ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 rounded-[28px] border border-dashed border-slate-200 bg-white/80 px-6 py-10">
              <div className="relative w-44 h-44 rounded-[30px] border border-slate-200 flex items-center justify-center mx-auto bg-gradient-to-br from-slate-50 to-white shadow-inner">
                <div className="absolute inset-6 rounded-[24px] border border-dashed border-slate-200" />
                <TenantBrandMark
                  logo={currentTenant.logo}
                  name={currentTenant.name}
                  className="w-20 h-20 rounded-[26px] relative z-10"
                  initialsClassName="text-xl"
                />
              </div>
              <div>
                <p className="text-gray-800 text-sm font-semibold">Generate a premium QR card</p>
                <p className="text-slate-500 text-xs mt-2 max-w-md">The output uses a centered restaurant logo on a white badge, premium spacing, and high-contrast QR styling for better presentation.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,0.12)] border border-white"
                  style={{ maxWidth: '420px', width: '100%' }}
                />
              )}
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Ready to print, frame, and share
              </div>
              <p className="text-xs text-slate-500 text-center max-w-md">Scans to the live menu while keeping your restaurant logo centered on a clean white background badge.</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Preview Stats */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="bg-white rounded-[28px] shadow-sm p-5 border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h3 className="text-gray-900 font-semibold text-sm">Menu Content Summary</h3>
              <p className="text-xs text-slate-500 mt-1">Make sure the QR points to a rich, current menu before printing.</p>
            </div>
            <div className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {countryLabel}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Categories', value: scopedCategories.length },
              { label: 'Menu Items', value: scopedMenuItems.length },
              { label: 'Available', value: availableItems },
              { label: 'Popular', value: scopedMenuItems.filter(i => i.isPopular).length },
              { label: 'New', value: scopedMenuItems.filter(i => i.isNew).length },
            ].map(stat => (
              <div key={stat.label} className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[28px] shadow-sm p-5 border border-gray-200 space-y-4">
          <div>
            <h3 className="text-gray-900 font-semibold text-sm">Print Notes</h3>
            <p className="text-xs text-slate-500 mt-1">Recommended for stickers, table tents, and premium tabletop stands.</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Use matte white paper or acrylic for the cleanest premium look.</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">The center badge stays white so the logo remains visible on every theme color.</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Generate again after menu updates to keep the live link aligned with the latest content.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
