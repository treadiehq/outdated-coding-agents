import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Prisma 7 no longer connects on its own: a driver adapter is required.
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
