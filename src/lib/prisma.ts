import { PrismaClient } from '@prisma/client';
import { fieldEncryptionExtension } from 'prisma-field-encryption';

let prisma: PrismaClient | undefined;


if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!prisma) {
    prisma = new PrismaClient();
  }
}

prisma.$extends(
  fieldEncryptionExtension()
)

export default prisma;