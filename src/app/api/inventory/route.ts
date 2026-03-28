import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_INVENTORY } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatInventoryItem(item: any) {
  const { mongoId, ...rest } = item
  return {
    ...rest,
    quantity: Number(rest.quantity ?? 0),
    minQuantity: Number(rest.minQuantity ?? 0),
    costPerUnit: Number(rest.costPerUnit ?? 0),
    lastRestocked: rest.lastRestocked ? new Date(rest.lastRestocked) : undefined,
  }
}

function normalizeInventoryPayload(payload: any) {
  return {
    id: payload.id,
    tenantId: payload.tenantId,
    name: payload.name,
    nameAr: payload.nameAr || null,
    unit: payload.unit,
    quantity: Number(payload.quantity ?? 0),
    minQuantity: Number(payload.minQuantity ?? 0),
    costPerUnit: Number(payload.costPerUnit ?? 0),
    supplierId: payload.supplierId || null,
    category: payload.category,
    lastRestocked: payload.lastRestocked ? new Date(payload.lastRestocked) : null,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')

  try {
    const items = await db.inventoryItem.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items.map(formatInventoryItem))
  } catch (e) {
    console.error('GET /api/inventory error:', e)
    return NextResponse.json(
      MOCK_INVENTORY
        .filter(item => tenantId ? item.tenantId === tenantId : true)
        .map(formatInventoryItem)
    )
  }
}

export async function POST(req: Request) {
  try {
    const payload = normalizeInventoryPayload(await req.json())
    const saved = await db.inventoryItem.upsert({
      where: { id: payload.id },
      create: payload,
      update: payload,
    })
    return NextResponse.json(formatInventoryItem(saved))
  } catch (e) {
    console.error('POST /api/inventory error:', e)
    return NextResponse.json({ error: 'Failed to save inventory item' }, { status: 500 })
  }
}
