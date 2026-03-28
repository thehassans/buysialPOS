import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_SUPPLIERS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatSupplier(supplier: any) {
  const { mongoId, ...rest } = supplier
  return {
    ...rest,
    isActive: rest.isActive ?? true,
  }
}

function normalizeSupplierPayload(payload: any) {
  return {
    id: payload.id,
    tenantId: payload.tenantId,
    name: payload.name,
    contact: payload.contact,
    email: payload.email || null,
    phone: payload.phone,
    address: payload.address || null,
    category: payload.category,
    paymentTerms: payload.paymentTerms || null,
    notes: payload.notes || null,
    isActive: payload.isActive ?? true,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')

  try {
    const suppliers = await db.supplier.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    })
    return NextResponse.json(suppliers.map(formatSupplier))
  } catch (e) {
    console.error('GET /api/suppliers error:', e)
    return NextResponse.json(
      MOCK_SUPPLIERS
        .filter(supplier => tenantId ? supplier.tenantId === tenantId : true)
        .map(formatSupplier)
    )
  }
}

export async function POST(req: Request) {
  try {
    const payload = normalizeSupplierPayload(await req.json())
    const saved = await db.supplier.upsert({
      where: { id: payload.id },
      create: payload,
      update: payload,
    })
    return NextResponse.json(formatSupplier(saved))
  } catch (e) {
    console.error('POST /api/suppliers error:', e)
    return NextResponse.json({ error: 'Failed to save supplier' }, { status: 500 })
  }
}
