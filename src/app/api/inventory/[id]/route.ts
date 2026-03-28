import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const saved = await db.inventoryItem.update({
      where: { id: params.id },
      data: {
        ...updates,
        quantity: updates.quantity === undefined ? undefined : Number(updates.quantity),
        minQuantity: updates.minQuantity === undefined ? undefined : Number(updates.minQuantity),
        costPerUnit: updates.costPerUnit === undefined ? undefined : Number(updates.costPerUnit),
        supplierId: updates.supplierId === undefined ? undefined : updates.supplierId || null,
        lastRestocked: updates.lastRestocked === undefined ? undefined : updates.lastRestocked ? new Date(updates.lastRestocked) : null,
      },
    })
    return NextResponse.json(formatInventoryItem(saved))
  } catch (e) {
    console.error('PATCH /api/inventory/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.inventoryItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/inventory/[id] error:', e)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
