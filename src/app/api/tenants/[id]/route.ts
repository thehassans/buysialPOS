import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatTenant(tenant: any) {
  return {
    ...tenant,
    createdAt: new Date(tenant.createdAt),
    validUntil: tenant.validUntil ? new Date(tenant.validUntil) : undefined,
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const { createdAt, ...rest } = updates
    const saved = await db.tenant.update({
      where: { id: params.id },
      data: {
        ...rest,
        validUntil: rest.validUntil ? new Date(rest.validUntil) : rest.validUntil === null ? null : undefined,
      },
    })
    return NextResponse.json(formatTenant(saved))
  } catch (e) {
    console.error('PATCH /api/tenants/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}
