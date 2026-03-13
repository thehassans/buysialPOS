import { NextResponse } from 'next/server'
import { MOCK_TENANTS } from '@/lib/mock-data'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
    const configuredPassword = process.env.SUPER_ADMIN_PASSWORD
    const configuredName = process.env.SUPER_ADMIN_NAME?.trim() || 'Platform Admin'

    if (!configuredEmail || !configuredPassword) {
      return NextResponse.json({ error: 'Super admin environment variables are not configured.', isPlatformUser: false }, { status: 503 })
    }

    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail || normalizedEmail !== configuredEmail) {
      return NextResponse.json({ error: 'Invalid platform credentials.', isPlatformUser: false }, { status: 401 })
    }

    if (String(password || '') !== configuredPassword) {
      return NextResponse.json({ error: 'Incorrect platform password.', isPlatformUser: true }, { status: 401 })
    }

    const tenant = MOCK_TENANTS[0]
    const user = {
      id: 'platform-super-admin',
      tenantId: tenant.id,
      name: configuredName,
      email: configuredEmail,
      role: 'super_admin' as const,
      language: 'en' as const,
      isActive: true,
      hourlyRate: 0,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      user,
      tenant: {
        ...tenant,
        createdAt: tenant.createdAt.toISOString(),
        validUntil: tenant.validUntil ? tenant.validUntil.toISOString() : undefined,
      },
    })
  } catch (error) {
    console.error('POST /api/platform-login error:', error)
    return NextResponse.json({ error: 'Failed to authenticate platform credentials.', isPlatformUser: false }, { status: 500 })
  }
}
