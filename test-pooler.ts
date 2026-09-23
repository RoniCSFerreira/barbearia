import { PrismaClient } from '@prisma/client'

async function tryRegion(region: string, port: number, pgbouncer: boolean) {
  const url = `postgresql://postgres.hxjfcavfljmodymtzoch:Scl52x3BxqRBiyFj@aws-0-${region}.pooler.supabase.com:${port}/postgres${pgbouncer ? '?pgbouncer=true' : ''}`
  console.log(`Testing ${region} on port ${port}...`)
  const p = new PrismaClient({ datasources: { db: { url } } })
  try {
    await p.$connect()
    const count = await p.organization.count()
    console.log(`✅ SUCCESS with ${region}:${port}! Org count: ${count}`)
    await p.$disconnect()
    return true
  } catch (e: any) {
    console.log(`❌ FAILED with ${region}:${port}:`, e.message?.slice(0, 150))
    await p.$disconnect()
    return false
  }
}

async function run() {
  const regions = ['sa-east-1', 'us-east-1', 'us-west-1', 'eu-central-1']
  for (const r of regions) {
    if (await tryRegion(r, 6543, true)) return
    if (await tryRegion(r, 5432, false)) return
  }
}

run()
