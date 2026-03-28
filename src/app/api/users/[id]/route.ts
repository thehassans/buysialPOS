import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatUser(user: any) {
  const { mongoId, ...rest } = user
  return { ...rest, createdAt: new Date(rest.createdAt) }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    if (updates.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin users must be configured through environment variables only.' },
        { status: 400 }
      )
    }
    const { createdAt, ...rest } = updates
    const saved = await db.user.update({ where: { id: params.id }, data: rest })
    return NextResponse.json(formatUser(saved))
  } catch (e) {
    console.error('PATCH /api/users/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
