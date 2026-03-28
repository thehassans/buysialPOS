import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Table } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const tables = await db.table.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { number: 'asc' },
    })
    return NextResponse.json(tables)
  } catch (e) {
    console.error('GET /api/tables error:', e)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const table: Table = await req.json()
    const saved = await db.table.upsert({
      where: { id: table.id },
      create: { ...table },
      update: { ...table },
    })
    return NextResponse.json(saved)
  } catch (e) {
    console.error('POST /api/tables error:', e)
    return NextResponse.json({ error: 'Failed to save table' }, { status: 500 })
  }
}
