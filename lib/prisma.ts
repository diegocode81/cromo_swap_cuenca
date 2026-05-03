import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function isClosedConnection(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /server has closed the connection|connection terminated unexpectedly|Can't reach database server/i.test(message);
}

export async function withPrismaRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (!isClosedConnection(error)) throw error;
    await prisma.$disconnect().catch(() => undefined);
    return operation();
  }
}
