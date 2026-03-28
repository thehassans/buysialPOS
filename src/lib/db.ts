import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function normalizeMongoDatabaseUrl(url?: string) {
  if (!url || (!url.startsWith('mongodb://') && !url.startsWith('mongodb+srv://'))) {
    return url
  }

  const protocolSeparatorIndex = url.indexOf('://')
  const pathStartIndex = url.indexOf('/', protocolSeparatorIndex + 3)

  if (pathStartIndex === -1) {
    return `${url}/buysialpos`
  }

  const pathAndQuery = url.slice(pathStartIndex)
  if (pathAndQuery === '/' || pathAndQuery.startsWith('/?')) {
    return `${url.slice(0, pathStartIndex)}/buysialpos${pathAndQuery.slice(1)}`
  }

  return url
}

process.env.DATABASE_URL = normalizeMongoDatabaseUrl(process.env.DATABASE_URL)

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
