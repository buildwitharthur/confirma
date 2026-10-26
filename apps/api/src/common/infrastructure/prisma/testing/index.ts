import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'The Prisma testing client can only be used with NODE_ENV=test.',
  );
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured to use Prisma testing.');
}

const adapter = new PrismaPg({ connectionString });

export const prismaTesting = new PrismaClient({ adapter });
