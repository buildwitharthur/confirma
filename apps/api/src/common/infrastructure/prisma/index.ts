import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured to use Prisma.');
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
