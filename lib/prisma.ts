import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

type GlobalForPrisma = {
  prisma?: PrismaClient
}

const globalForPrisma = global as unknown as GlobalForPrisma

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const adapter = new PrismaPg({ connectionString })

const createClient = () =>
  new PrismaClient({
    adapter,
  })

const existing = globalForPrisma.prisma

// In dev, if schema changed and the cached client predates a model addition,
// recreate it so new delegates (e.g. dailyReport, queryManagement) exist.
const cachedClientHasModel = (client: PrismaClient | undefined) => {
  if (!client) return false
  const delegates = client as unknown as Record<string, unknown>
  return (
    typeof delegates.dailyReport !== "undefined" &&
    typeof delegates.queryManagement !== "undefined" &&
    typeof delegates.deviceToken !== "undefined"
  )
}

export const prisma = cachedClientHasModel(existing) ? existing : createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
