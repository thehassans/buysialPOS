import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_TENANTS } from '@/lib/mock-data'

function formatTenant(tenant: any) {
  return {
    ...tenant,
    createdAt: new Date(tenant.createdAt),
    validUntil: tenant.validUntil ? new Date(tenant.validUntil) : undefined,
  }
}

function normalizeTenantPayload(payload: any) {
  return {
    id: payload.id,
    name: payload.name,
    slug: payload.slug,
    logo: payload.logo || null,
    countryCode: payload.countryCode,
    currency: payload.currency,
    vatRate: Number(payload.vatRate ?? 0),
    vatNumber: payload.vatNumber || null,
    address: payload.address || '',
    phone: payload.phone || '',
    email: payload.email || '',
    subscriptionPlan: payload.subscriptionPlan,
    isActive: payload.isActive ?? true,
    createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
    validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
    invoiceFooter: payload.invoiceFooter || null,
    primaryColor: payload.primaryColor || null,
    adminPassword: payload.adminPassword || null,
  }
}

export async function GET() {
  try {
    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tenants.map(formatTenant))
  } catch (e) {
    console.error('GET /api/tenants error:', e)
    return NextResponse.json(MOCK_TENANTS.map(formatTenant))
  }
}

export async function POST(req: Request) {
  try {
    const payload = normalizeTenantPayload(await req.json())
    const saved = await db.tenant.upsert({
      where: { id: payload.id },
      create: payload,
      update: { ...payload, createdAt: undefined },
    })
    return NextResponse.json(formatTenant(saved))
  } catch (e) {
    console.error('POST /api/tenants error:', e)
    return NextResponse.json({ error: 'Failed to save tenant' }, { status: 500 })
  }
}
