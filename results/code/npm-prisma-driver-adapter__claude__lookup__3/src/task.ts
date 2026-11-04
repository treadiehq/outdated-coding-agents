import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Prisma 7 requires a driver adapter; the connection string is passed to it
// rather than read from the schema's datasource.
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
