import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

// pg silently falls back to its own defaults when no connection string is given.
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
