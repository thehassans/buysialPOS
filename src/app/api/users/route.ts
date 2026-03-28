import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_USERS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatUser(user: any) {
  const { mongoId, ...rest } = user
  return {
    ...rest,
    createdAt: new Date(rest.createdAt),
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')

  try {
    const users = await db.user.findMany({
      where: tenantId ? { tenantId } : undefined,
    })

    return NextResponse.json(
      users
        .filter((user: typeof users[number]) => user.role !== 'super_admin')
        .map(formatUser)
    )
  } catch (e) {
    console.error('GET /api/users error:', e)

    const fallbackUsers = MOCK_USERS
      .filter(user => (tenantId ? user.tenantId === tenantId : true) && user.role !== 'super_admin')
      .map(formatUser)

    return NextResponse.json(fallbackUsers)
  }
}

export async function POST(req: Request) {
  try {
    const user = await req.json()

    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin users must be configured through environment variables only.' },
        { status: 400 }
      )
    }

    const { createdAt, ...rest } = user
    const saved = await db.user.upsert({
      where: { id: user.id },
      create: { ...rest, createdAt: createdAt ? new Date(createdAt) : new Date() },
      update: rest,
    })

    return NextResponse.json(formatUser(saved))
  } catch (e) {
    console.error('POST /api/users error:', e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
