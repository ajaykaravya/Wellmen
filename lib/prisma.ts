import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

config({ path: ".env" })

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
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

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}