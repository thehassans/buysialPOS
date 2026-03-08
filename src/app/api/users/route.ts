import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const users = await db.user.findMany({
      where: tenantId ? { tenantId } : undefined,
    })
    return NextResponse.json(users.map((u: typeof users[number]) => ({ ...u, createdAt: new Date(u.createdAt) })))
  } catch (e) {
    console.error('GET /api/users error:', e)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await req.json()
    const { createdAt, ...rest } = user
    const saved = await db.user.upsert({
      where: { id: user.id },
      create: { ...rest, createdAt: createdAt ? new Date(createdAt) : new Date() },
      update: rest,
    })
    return NextResponse.json({ ...saved, createdAt: new Date(saved.createdAt) })
  } catch (e) {
    console.error('POST /api/users error:', e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
