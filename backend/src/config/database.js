// Khoi tao 1 instance PrismaClient duy nhat cho toan bo ung dung
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Dong ket noi khi process tat
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
