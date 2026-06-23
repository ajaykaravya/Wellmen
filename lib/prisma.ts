import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

config({ path: ".env" })

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const cachedClientHasModel = (client: PrismaClient | undefined) => {
  if (!client) return false
  const delegates = client as unknown as Record<string, unknown>
  return (
    typeof delegates.dailyReport !== "undefined" &&
    typeof delegates.queryManagement !== "undefined" &&
    typeof delegates.deviceToken !== "undefined" &&
    typeof delegates.expenseType !== "undefined" &&
    typeof delegates.financeTransaction !== "undefined" &&
    typeof delegates.incomeTransaction !== "undefined" &&
    typeof delegates.transportConfig !== "undefined" &&
    typeof delegates.company !== "undefined"
  )
}

function createPrisma() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required to initialize Prisma.")
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
    log: ["error", "warn"],
  })
}

// Reuse existing client if it has all models, otherwise create new one
export const prisma = cachedClientHasModel(globalForPrisma.prisma)
  ? (globalForPrisma.prisma as PrismaClient)
  : createPrisma()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
