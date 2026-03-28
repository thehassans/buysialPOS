import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Order } from '@/lib/types'
import { enqueueSyncOperation } from '@/lib/syncService'

function dbToOrder(o: any): Order {
  const { mongoId, itemsJson, ...rest } = o
  return {
    ...rest,
    items: JSON.parse(itemsJson || '[]'),
    createdAt: new Date(rest.createdAt),
    updatedAt: new Date(rest.updatedAt),
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const orders = await db.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders.map(dbToOrder))
  } catch (e) {
    console.error('GET /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const order: Order = await req.json()
    const { items, createdAt, updatedAt, ...rest } = order
    const saved = await db.order.upsert({
      where: { id: order.id },
      create: {
        ...rest,
        itemsJson: JSON.stringify(items),
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
      update: {
        ...rest,
        itemsJson: JSON.stringify(items),
        updatedAt: new Date(),
      },
    })
    
    // Add to SyncQueue so it gets pushed to the Online Portal later
    await enqueueSyncOperation('Order', saved.id, 'CREATE', saved);
    
    return NextResponse.json(dbToOrder(saved))
  } catch (e) {
    console.error('POST /api/orders error:', e)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
