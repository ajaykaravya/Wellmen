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

// In dev, if schema changed and global client was created earlier,
// recreate the client so new model delegates (e.g. dailyReport) exist.
const hasReportingModel =
  existing && typeof (existing as unknown as Record<string, unknown>).dailyReport !== "undefined"

export const prisma = existing && hasReportingModel ? existing : createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
