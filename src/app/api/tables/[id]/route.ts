import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const updated = await db.table.update({
      where: { id: params.id },
      data: updates,
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/tables/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await db.table.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/tables/[id] error:', e)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
