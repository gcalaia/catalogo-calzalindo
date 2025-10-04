import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error', 'warn'],
  });
};

declare global {
  var prismaInstance: undefined | ReturnType<typeof prismaClientSingleton>;
}

// En desarrollo NO cachear la instancia para evitar prepared statements
const prisma = process.env.NODE_ENV === 'development' 
  ? prismaClientSingleton()
  : (globalThis.prismaInstance ?? prismaClientSingleton());

if (process.env.NODE_ENV === 'production' && !globalThis.prismaInstance) {
  globalThis.prismaInstance = prisma;
}

export { prisma };