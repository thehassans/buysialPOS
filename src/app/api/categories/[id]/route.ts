import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const saved = await db.category.update({
      where: { id: params.id },
      data: updates,
    })
    return NextResponse.json(saved)
  } catch (e) {
    console.error('PATCH /api/categories/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.category.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/categories/[id] error:', e)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
