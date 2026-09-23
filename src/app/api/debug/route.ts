import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info: Record<string, string> = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV || 'undefined',
    db_url_set: process.env.DATABASE_URL ? 'YES' : 'NO',
    db_url_preview: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@').substring(0, 90)
      : 'NOT SET',
    jwt_secret_set: process.env.JWT_SECRET ? 'YES' : 'NO (using fallback)',
    admin_email: process.env.ADMIN_EMAIL || 'NOT SET',
  }

  try {
    const userCount = await db.user.count()
    const orgCount = await db.organization.count()
    return NextResponse.json({
      status: 'DB OK',
      userCount,
      orgCount,
      env: info,
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { status: 'DB ERROR', error, env: info },
      { status: 500 }
    )
  }
}
