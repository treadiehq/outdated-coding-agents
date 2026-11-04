import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const prisma = new PrismaClient({
  datasourceUrl: connectionString,
});
