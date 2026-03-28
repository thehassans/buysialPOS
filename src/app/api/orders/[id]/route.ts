import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatOrder(order: any) {
  const { mongoId, itemsJson, ...rest } = order
  return {
    ...rest,
    items: JSON.parse(itemsJson || '[]'),
    createdAt: new Date(rest.createdAt),
    updatedAt: new Date(rest.updatedAt),
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const { items, createdAt, ...rest } = updates
    const data: any = { ...rest, updatedAt: new Date() }
    if (items !== undefined) data.itemsJson = JSON.stringify(items)
    const saved = await db.order.update({ where: { id: params.id }, data })
    return NextResponse.json(formatOrder(saved))
  } catch (e) {
    console.error('PATCH /api/orders/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.order.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
