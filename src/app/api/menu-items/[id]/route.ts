import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const saved = await db.menuItem.update({ where: { id: params.id }, data: updates })
    return NextResponse.json(saved)
  } catch (e) {
    console.error('PATCH /api/menu-items/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.menuItem.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}
