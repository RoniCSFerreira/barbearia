import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────
// Singleton do PrismaClient para ambientes Next.js
//
// Em desenvolvimento, o hot-reload do Next.js cria múltiplos
// módulos, o que geraria múltiplas instâncias do PrismaClient
// e o erro "Too many connections". Ao usar globalThis, a
// instância é reutilizada entre hot-reloads.
//
// Em produção, o módulo é carregado uma única vez, então o
// singleton não é estritamente necessário — mas é boa prática.
// ─────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
