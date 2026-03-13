import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_USERS, MOCK_MENU_ITEMS, MOCK_ORDERS } from '@/lib/mock-data'

export async function POST() {
  try {
    const [userCount, menuCount, orderCount] = await Promise.all([
      db.user.count(),
      db.menuItem.count(),
      db.order.count(),
    ])

    if (userCount === 0) {
      for (const user of MOCK_USERS) {
        const createData: any = {
          id: user.id,
          tenantId: user.tenantId,
          name: user.name,
          email: user.email,
          role: user.role,
          language: user.language,
          isActive: user.isActive,
          hourlyRate: user.hourlyRate,
          createdAt: user.createdAt,
        }
        if (user.password) createData.password = user.password
        await db.user.upsert({
          where: { id: user.id },
          update: {},
          create: createData,
        })
      }
    }

    if (menuCount === 0) {
      for (const item of MOCK_MENU_ITEMS) {
        await db.menuItem.upsert({
          where: { id: item.id },
          update: {},
          create: {
            id: item.id,
            tenantId: item.tenantId,
            categoryId: item.categoryId,
            name: item.name,
            nameAr: item.nameAr,
            description: item.description,
            price: item.price,
            image: item.image,
            isAvailable: item.isAvailable,
            preparationTime: item.preparationTime,
            calories: item.calories,
            isPopular: item.isPopular ?? false,
            isNew: item.isNew ?? false,
          },
        })
      }
    }

    if (orderCount === 0) {
      for (const order of MOCK_ORDERS) {
        await db.order.upsert({
          where: { id: order.id },
          update: {},
          create: {
            id: order.id,
            tenantId: order.tenantId,
            tableNumber: order.tableNumber,
            waiterId: order.waiterId,
            status: order.status,
            subtotal: order.subtotal,
            vatRate: order.vatRate,
            vatAmount: order.vatAmount,
            total: order.total,
            isPaid: order.isPaid,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            invoiceNumber: order.invoiceNumber,
            itemsJson: JSON.stringify(order.items),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      seeded: { users: userCount === 0, menu: menuCount === 0, orders: orderCount === 0 },
    })
  } catch (e) {
    console.error('Seed error:', e)
    return NextResponse.json({ error: 'Seed failed', details: String(e) }, { status: 500 })
  }
}
