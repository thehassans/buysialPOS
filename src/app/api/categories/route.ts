import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_CATEGORIES } from '@/lib/mock-data'

function normalizeCategoryPayload(payload: any) {
  return {
    id: payload.id,
    tenantId: payload.tenantId,
    name: payload.name,
    nameAr: payload.nameAr || null,
    icon: payload.icon || null,
    sortOrder: Number(payload.sortOrder ?? 1),
    isActive: payload.isActive ?? true,
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tenantId = searchParams.get('tenantId')

  try {
    const categories = await db.category.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(categories)
  } catch (e) {
    console.error('GET /api/categories error:', e)
    return NextResponse.json(
      MOCK_CATEGORIES
        .filter(category => tenantId ? category.tenantId === tenantId : true)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    )
  }
}

export async function POST(req: Request) {
  try {
    const payload = normalizeCategoryPayload(await req.json())
    const saved = await db.category.upsert({
      where: { id: payload.id },
      create: payload,
      update: payload,
    })
    return NextResponse.json(saved)
  } catch (e) {
    console.error('POST /api/categories error:', e)
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 })
  }
}
