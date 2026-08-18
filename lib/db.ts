/**
 * Prisma client singleton.
 *
 * Engine binaries are downloaded by `prisma generate`. If that step has not
 * run yet (or the host cannot reach binaries.prisma.sh), callers should treat
 * the client as unavailable rather than crashing the app at import time.
 */

type PrismaLike = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
  $disconnect: () => Promise<void>;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaLike;
};

function createClient(): PrismaLike | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client") as {
      PrismaClient: new (args?: { log?: string[] }) => PrismaLike;
    };
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (error) {
    console.warn("[db] Prisma client is not ready:", error);
    return undefined;
  }
}

export const prisma: PrismaLike | undefined =
  globalForPrisma.prisma ?? createClient();

if (prisma && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabase(): Promise<"ok" | "unavailable"> {
  if (!prisma) return "unavailable";
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "unavailable";
  }
}
