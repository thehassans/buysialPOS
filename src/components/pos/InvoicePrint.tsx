'use client'

import { Order, Tenant } from '@/lib/types'
import { TaxEngine, generateZATCAQRData, COUNTRY_CONFIGS } from '@/lib/country-config'
import { printHtmlDocument } from '@/lib/printer-runtime'

function getPrintableBrandMarkup(tenant: Tenant) {
  if (tenant.logo) {
    return `<img src="${tenant.logo}" alt="${tenant.name}" style="width:48px;height:48px;object-fit:cover;border-radius:12px;border:1px solid #d1d5db;margin:0 auto 6px auto;display:block;" />`
  }
  return `<div class="logo">🍽️</div>`
}

export function printCustomerInvoice(order: Order, tenant: Tenant) {
  const taxEngine = new TaxEngine(tenant.countryCode, tenant.vatRate)
  const config = COUNTRY_CONFIGS[tenant.countryCode]

  let zatcaQR = ''
  if (tenant.countryCode === 'KSA') {
    zatcaQR = generateZATCAQRData({
      sellerName: tenant.name,
      vatNumber: tenant.vatNumber || '',
      timestamp: new Date(order.createdAt).toISOString(),
      total: order.total,
      vatAmount: order.vatAmount,
    })
  }

  const orderTypeLabel = order.orderType === 'takeaway' ? '🥡 Take Away' : '🍽️ Dine In'
  const countryFlag = tenant.countryCode === 'KSA' ? '🇸🇦' : tenant.countryCode === 'UAE' ? '🇦🇪' : '🇴🇲'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${order.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; font-size: 12px; color: #000; background: #fff; }
    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .logo { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .restaurant-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .address { font-size: 10px; color: #333; }
    .compliance { font-size: 10px; font-weight: bold; margin-top: 4px; border: 1px solid #000; display: inline-block; padding: 2px 6px; }
    .invoice-meta { margin: 8px 0; border-bottom: 1px dashed #000; padding-bottom: 8px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
    .order-type { display: inline-block; padding: 2px 8px; background: #000; color: #fff; font-size: 11px; font-weight: bold; margin: 4px 0; }
    .items-table { width: 100%; margin: 8px 0; }
    .item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
    .item-name { flex: 1; }
    .item-qty { width: 20px; text-align: center; }
    .item-price { text-align: right; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .totals { }
    .total-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
    .total-row.grand { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
    .qr-section { text-align: center; margin: 12px 0; border-top: 1px dashed #000; padding-top: 8px; }
    .qr-section img { width: 80px; height: 80px; }
    .qr-label { font-size: 9px; margin-top: 4px; }
    .footer { text-align: center; border-top: 2px dashed #000; padding-top: 8px; margin-top: 8px; }
    .footer-text { font-size: 10px; margin-bottom: 2px; }
    .customer-section { margin: 6px 0; padding: 6px; border: 1px solid #000; background: #f9f9f9; }
    @media print {
      body { width: 80mm; }
      @page { size: 80mm auto; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${getPrintableBrandMarkup(tenant)}
    <div class="restaurant-name">${countryFlag} ${tenant.name}</div>
    <div class="address">${tenant.address}</div>
    <div class="address">Tel: ${tenant.phone}</div>
    ${tenant.vatNumber ? `<div class="address">VAT No: ${tenant.vatNumber}</div>` : ''}
    <div><span class="compliance">${config.complianceLabel}</span></div>
  </div>

  <div class="invoice-meta">
    <div class="meta-row"><span>Invoice:</span><span><b>${order.invoiceNumber}</b></span></div>
    <div class="meta-row"><span>Date:</span><span>${new Date(order.createdAt).toLocaleString()}</span></div>
    ${order.tableNumber ? `<div class="meta-row"><span>Table:</span><span><b>${order.tableNumber}</b></span></div>` : ''}
    <div class="meta-row"><span>Type:</span><span><span class="order-type">${orderTypeLabel}</span></span></div>
    ${order.customerName ? `<div class="customer-section"><b>Customer:</b> ${order.customerName}${order.customerPhone ? `<br>📞 ${order.customerPhone}` : ''}</div>` : ''}
    ${order.notes ? `<div class="meta-row"><span>Notes:</span><span>${order.notes}</span></div>` : ''}
  </div>

  <div class="divider"></div>
  <div style="font-size:10px; font-weight:bold; margin-bottom:4px; display:flex; justify-content:space-between;">
    <span>ITEM</span><span>QTY</span><span>TOTAL</span>
  </div>
  <div class="divider"></div>

  <div class="items-table">
    ${order.items.map(item => `
    <div class="item-row">
      <span class="item-name">${item.menuItem.name}</span>
      <span class="item-qty">${item.quantity}</span>
      <span class="item-price">${taxEngine.formatCurrency(item.unitPrice * item.quantity)}</span>
    </div>
    <div style="font-size:9px; color:#555; padding-left:8px; margin-bottom:2px;">${taxEngine.formatCurrency(item.unitPrice)} each</div>
    `).join('')}
  </div>

  <div class="divider"></div>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${taxEngine.formatCurrency(order.subtotal)}</span>
    </div>
    <div class="total-row">
      <span>${taxEngine.getVatLabel()}</span>
      <span>${taxEngine.formatCurrency(order.vatAmount)}</span>
    </div>
    ${order.isPaid ? `<div class="total-row" style="color:#16a34a;"><span>Payment (${order.paymentMethod || 'cash'})</span><span>✓ PAID</span></div>` : ''}
    <div class="total-row grand">
      <span>TOTAL</span>
      <span>${taxEngine.formatCurrency(order.total)}</span>
    </div>
  </div>

  ${tenant.countryCode === 'KSA' && zatcaQR ? `
  <div class="qr-section">
    <div style="font-size:9px; font-weight:bold; margin-bottom:4px;">ZATCA QR Code</div>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(zatcaQR)}" alt="ZATCA QR" />
    <div class="qr-label">Scan to verify invoice</div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="footer-text">${tenant.invoiceFooter || 'Thank you for your visit!'}</div>
    <div class="footer-text" style="margin-top:4px; font-size:9px;">Powered by Buysial ERP</div>
    <div class="footer-text" style="font-size:9px;">${new Date().toLocaleString()}</div>
  </div>
</body>
</html>`

  void printHtmlDocument(html, `Invoice ${order.invoiceNumber}`, 'cashier', tenant)
}

export function printKitchenTicket(order: Order, tenant: Tenant) {
  const orderTypeLabel = order.orderType === 'takeaway' ? '🥡 TAKE AWAY' : '🍽️ DINE IN'
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
    <div class="kitchen-title">🍳 KITCHEN</div>
    <div>${tenant.name}</div>
    <div class="order-badge">${order.invoiceNumber}</div>
    <div><span class="order-type">${orderTypeLabel}</span></div>
    ${order.tableNumber ? `<div class="meta">TABLE: <b>${order.tableNumber}</b></div>` : ''}
    ${order.customerName ? `<div class="meta">CUSTOMER: <b>${order.customerName}</b></div>` : ''}
  </div>

  <div class="meta" style="text-align:center;">⏰ ${new Date(order.createdAt).toLocaleTimeString()}</div>
  <div class="divider"></div>

  ${order.items.map(item => `
  <div class="item">
    <span class="item-qty">× ${item.quantity}</span>
    <div class="item-name">${item.menuItem.name}</div>
    ${item.notes ? `<div class="item-notes">Note: ${item.notes}</div>` : ''}
  </div>
  `).join('')}

  ${order.notes ? `<div class="divider"></div><div class="meta"><b>ORDER NOTES:</b> ${order.notes}</div>` : ''}

  <div class="footer">
    <div>Printed: ${new Date().toLocaleTimeString()}</div>
  </div>
</body>
</html>`

  void printHtmlDocument(html, `Kitchen Ticket ${order.invoiceNumber}`, 'kitchen', tenant)
}
