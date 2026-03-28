import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function formatSupplier(supplier: any) {
  const { mongoId, ...rest } = supplier
  return {
    ...rest,
    isActive: rest.isActive ?? true,
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json()
    const saved = await db.supplier.update({
      where: { id: params.id },
      data: {
        ...updates,
        email: updates.email === undefined ? undefined : updates.email || null,
        address: updates.address === undefined ? undefined : updates.address || null,
        paymentTerms: updates.paymentTerms === undefined ? undefined : updates.paymentTerms || null,
        notes: updates.notes === undefined ? undefined : updates.notes || null,
      },
    })
    return NextResponse.json(formatSupplier(saved))
  } catch (e) {
    console.error('PATCH /api/suppliers/[id] error:', e)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.supplier.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/suppliers/[id] error:', e)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
