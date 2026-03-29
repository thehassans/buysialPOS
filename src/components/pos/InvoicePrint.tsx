'use client'

import { Order, Tenant } from '@/lib/types'
import { TaxEngine, generateZATCAQRData, COUNTRY_CONFIGS } from '@/lib/country-config'
import { isTenantInvoiceQrEnabled } from '@/lib/tenant-compliance'
import { printHtmlDocument } from '@/lib/printer-runtime'
import QRCode from 'qrcode'

function getPrintableBrandMarkup(tenant: Tenant) {
  if (tenant.logo) {
    return `<div class="brand-mark"><img src="${tenant.logo}" alt="${tenant.name}" /></div>`
  }
  return `<div class="brand-mark brand-fallback">${tenant.name.charAt(0)}</div>`
}

export function getInvoiceZatcaPayload(order: Order, tenant: Tenant) {
  if (!isTenantInvoiceQrEnabled(tenant.id, tenant.countryCode)) return ''
  return generateZATCAQRData({
    sellerName: tenant.name,
    vatNumber: tenant.vatNumber || '',
    timestamp: new Date(order.createdAt).toISOString(),
    total: order.total,
    vatAmount: order.vatAmount,
  })
}

export async function buildInvoiceZatcaQrDataUrl(order: Order, tenant: Tenant) {
  const payload = getInvoiceZatcaPayload(order, tenant)
  if (!payload) return ''
  try {
    return await QRCode.toDataURL(payload, {
      width: 128,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
  } catch {
    return ''
  }
}

export async function printCustomerInvoice(order: Order, tenant: Tenant) {
  const taxEngine = new TaxEngine(tenant.countryCode, tenant.vatRate)
  const config = COUNTRY_CONFIGS[tenant.countryCode]
  const zatcaQrDataUrl = await buildInvoiceZatcaQrDataUrl(order, tenant)

  const orderTypeLabel = order.orderType === 'takeaway' ? 'Take Away' : 'Dine In'
  const countryFlag = tenant.countryCode === 'KSA' ? '🇸🇦' : tenant.countryCode === 'UAE' ? '🇦🇪' : '🇴🇲'
  const accentColor = tenant.primaryColor || '#059669'
  const metaTone = tenant.secondaryColor || '#0f766e'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${order.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, Arial, sans-serif; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; color: #0f172a; background: #fff; }
    .invoice-card { border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; }
    .header { text-align: center; padding: 14px 12px 12px 12px; margin-bottom: 8px; background: linear-gradient(180deg, ${accentColor} 0%, ${metaTone} 100%); color: #ffffff; }
    .brand-mark { width: 52px; height: 52px; margin: 0 auto 8px auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.35); background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16); color: ${accentColor}; font-weight: 800; font-size: 20px; }
    .brand-mark img { width: 78%; height: 78%; object-fit: contain; display: block; }
    .restaurant-name { font-size: 15px; font-weight: 800; margin-bottom: 2px; }
    .address { font-size: 10px; color: rgba(255,255,255,0.82); }
    .compliance { font-size: 10px; font-weight: 700; margin-top: 6px; border: 1px solid rgba(255,255,255,0.3); display: inline-block; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,0.12); }
    .content { padding: 0 12px 12px 12px; }
    .invoice-meta { margin: 8px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
    .order-type { display: inline-block; padding: 3px 10px; background: ${accentColor}; color: #fff; font-size: 11px; font-weight: 700; margin: 4px 0; border-radius: 999px; }
    .items-table { width: 100%; margin: 8px 0; }
    .item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
    .item-name { flex: 1; }
    .item-qty { width: 20px; text-align: center; }
    .item-price { text-align: right; }
    .divider { border-top: 1px dashed #cbd5e1; margin: 8px 0; }
    .totals { }
    .total-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
    .total-row.grand { font-size: 14px; font-weight: 800; border-top: 2px solid #0f172a; padding-top: 6px; margin-top: 6px; }
    .qr-section { text-align: center; margin: 12px 0; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
    .qr-badge { width: 110px; height: 110px; padding: 10px; margin: 0 auto; border-radius: 22px; border: 1px solid #e2e8f0; background: #ffffff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
    .qr-section img { width: 100%; height: 100%; display: block; }
    .qr-label { font-size: 9px; margin-top: 4px; }
    .footer { text-align: center; border-top: 2px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }
    .footer-text { font-size: 10px; margin-bottom: 2px; }
    .customer-section { margin: 6px 0; padding: 8px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
    @media print {
      body { width: 80mm; }
      @page { size: 80mm auto; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      ${getPrintableBrandMarkup(tenant)}
      <div class="restaurant-name">${countryFlag} ${tenant.name}</div>
      <div class="address">${tenant.address}</div>
      ${tenant.phone ? `<div class="address">${tenant.phone}</div>` : ''}
      ${tenant.vatNumber ? `<div class="address">VAT No: ${tenant.vatNumber}</div>` : ''}
      ${tenant.crNumber ? `<div class="address">CR No: ${tenant.crNumber}</div>` : ''}
    </div>

    <div class="content">
      <div class="invoice-meta">
        <div class="meta-row"><span>Invoice · <span dir='rtl'>فاتورة</span></span><span><b>${order.invoiceNumber}</b></span></div>
        <div class="meta-row"><span>Date · <span dir='rtl'>التاريخ</span></span><span>${new Date(order.createdAt).toLocaleString()}</span></div>
        ${order.tableNumber ? `<div class="meta-row"><span>Table · <span dir='rtl'>الطاولة</span></span><span><b>${order.tableNumber}</b></span></div>` : ''}
        <div class="meta-row"><span>Type · <span dir='rtl'>النوع</span></span><span><span class="order-type">${orderTypeLabel}</span></span></div>
        ${order.customerName ? `<div class="customer-section"><b>Customer:</b> ${order.customerName}${order.customerPhone ? `<br>📞 ${order.customerPhone}` : ''}</div>` : ''}
        ${order.notes ? `<div class="meta-row"><span>Notes · <span dir='rtl'>ملاحظات</span></span><span>${order.notes}</span></div>` : ''}
        ${order.isEdited ? `<div style="margin-top:6px;padding:4px 8px;background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;font-size:10px;color:#92400e;">✎ EDITED · ${order.lastEditedByName || ''} · ${order.lastEditedAt ? new Date(order.lastEditedAt).toLocaleString() : ''}</div>` : ''}
      </div>

      <div class="divider"></div>
      <div style="font-size:10px; font-weight:700; margin-bottom:4px; display:flex; justify-content:space-between; color:#475569;">
        <span>ITEM</span><span>QTY</span><span>TOTAL · <span dir='rtl'>الإجمالي</span></span>
      </div>
      <div class="divider"></div>

      <div class="items-table">
        ${order.items.map(item => `
        <div class="item-row" style="align-items: flex-start; margin-bottom:2px;">
          <div class="item-name" style="flex:1; display:flex; flex-direction:column;">
            <span>${item.menuItem.name}</span>
            ${item.menuItem.nameAr ? `<span dir="rtl" style="font-size:10px; color:#64748b; font-weight:normal; margin-top:2px;">${item.menuItem.nameAr}</span>` : ''}
          </div>
          <span class="item-qty" style="padding: 0 4px;">${item.quantity}</span>
          <span class="item-price">${taxEngine.formatCurrency(item.unitPrice * item.quantity)}</span>
        </div>
        <div style="font-size:9px; color:#64748b; padding-left:8px; margin-bottom:6px;">${taxEngine.formatCurrency(item.unitPrice)} each</div>
        `).join('')}
      </div>

      <div class="divider"></div>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal · <span dir='rtl'>المجموع الفرعي</span></span>
          <span>${taxEngine.formatCurrency(order.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>${taxEngine.getVatLabel()}</span>
          <span>${taxEngine.formatCurrency(order.vatAmount)}</span>
        </div>
        ${order.isPaid ? `<div class="total-row" style="color:#16a34a;"><span>Payment (${order.paymentMethod || 'cash'})</span><span>✓ PAID</span></div>` : ''}
        <div class="total-row grand">
          <span>TOTAL · <span dir='rtl'>الإجمالي</span></span>
          <span>${taxEngine.formatCurrency(order.total)}</span>
        </div>
      </div>

      ${zatcaQrDataUrl ? `
      <div class="qr-section">
        <div style="font-size:9px; font-weight:700; margin-bottom:6px; color:#475569;">ZATCA QR Code</div>
        <div class="qr-badge">
          <img src="${zatcaQrDataUrl}" alt="ZATCA QR" />
        </div>
        <div class="qr-label">Scan to verify invoice</div>
      </div>
      ` : ''}

      ${order.isEdited && order.editHistory && order.editHistory.length > 0 ? `
      <div style="border-top:1px dashed #cbd5e1;margin-top:8px;padding-top:8px;">
        <div style="font-size:10px;font-weight:700;color:#92400e;margin-bottom:4px;">✎ Edit History</div>
        ${order.editHistory.map(h => `<div style="font-size:9px;color:#78350f;margin-bottom:2px;">${new Date(h.editedAt).toLocaleString()} — ${h.editedByName}: ${h.changes}</div>`).join('')}
      </div>` : ''}

      <div class="footer">
        <div class="footer-text">${tenant.invoiceFooter || 'Thank you for your visit! · شكراً لزيارتكم'}</div>
        <div class="footer-text" style="margin-top:4px; font-size:9px;">Powered by Buysial ERP</div>
        <div class="footer-text" style="font-size:9px;">${new Date().toLocaleString()}</div>
      </div>
    </div>
  </div>
</body>
</html>`

  void printHtmlDocument(html, `Invoice ${order.invoiceNumber}`, 'cashier', tenant)
}

export function printKitchenTicket(order: Order, tenant: Tenant) {
  const orderTypeLabel = order.orderType === 'takeaway' ? 'TAKE AWAY' : 'DINE IN'
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kitchen Ticket</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; font-size: 14px; color: #000; background: #fff; }
    .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
    .kitchen-title { font-size: 20px; font-weight: bold; }
    .order-badge { display: inline-block; background: #000; color: #fff; padding: 4px 16px; font-size: 18px; font-weight: bold; margin: 4px 0; }
    .order-type { display: inline-block; background: #333; color: #fff; padding: 3px 12px; font-size: 13px; font-weight: bold; margin: 4px 0; }
    .meta { font-size: 12px; margin: 4px 0; }
    .divider { border-top: 2px dashed #000; margin: 8px 0; }
    .item { margin-bottom: 8px; padding: 6px; border: 1px solid #000; }
    .item-name { font-size: 15px; font-weight: bold; }
    .item-qty { font-size: 22px; font-weight: bold; float: right; }
    .item-notes { font-size: 11px; color: #333; margin-top: 2px; font-style: italic; }
    .footer { text-align: center; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; font-size: 11px; }
    @media print {
      body { width: 80mm; }
      @page { size: 80mm auto; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${tenant.logo ? `<img src="${tenant.logo}" alt="${tenant.name}" style="width:42px;height:42px;object-fit:cover;border-radius:10px;border:1px solid #d1d5db;margin:0 auto 6px auto;display:block;" />` : ''}
    <div class="kitchen-title">ðŸ³ KITCHEN</div>
    <div>${tenant.name}</div>
    <div class="order-badge">${order.invoiceNumber}</div>
    <div><span class="order-type">${orderTypeLabel}</span></div>
    ${order.tableNumber ? `<div class="meta">TABLE · الطاولة: <b>${order.tableNumber}</b></div>` : ''}
    ${order.customerName ? `<div class="meta">CUSTOMER · العميل: <b>${order.customerName}</b></div>` : ''}
  </div>

  <div class="meta" style="text-align:center;">â° ${new Date(order.createdAt).toLocaleTimeString()}</div>
  <div class="divider"></div>

  ${order.items.map(item => `
  <div class="item">
    <span class="item-qty">Ã— ${item.quantity}</span>
    <div class="item-name">${item.menuItem.name}</div>
    ${item.notes ? `<div class="item-notes">Note: ${item.notes}</div>` : ''}
  </div>
  `).join('')}

  ${order.notes ? `<div class="divider"></div><div class="meta"><b>ORDER NOTES · ملاحظات:</b> ${order.notes}</div>` : ''}

  <div class="footer">
    <div>Printed: ${new Date().toLocaleTimeString()}</div>
  </div>
</body>
</html>`

  void printHtmlDocument(html, `Kitchen Ticket ${order.invoiceNumber}`, 'kitchen', tenant)
}


