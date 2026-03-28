import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatMenuItem(item: any) {
  const { mongoId, ...rest } = item
  return rest
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const items = await db.menuItem.findMany({
      where: tenantId ? { tenantId } : undefined,
    })
    return NextResponse.json(items.map(formatMenuItem))
  } catch (e) {
    console.error('GET /api/menu-items error:', e)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const item = await req.json()
    const saved = await db.menuItem.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    })
    return NextResponse.json(formatMenuItem(saved))
  } catch (e) {
    console.error('POST /api/menu-items error:', e)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
