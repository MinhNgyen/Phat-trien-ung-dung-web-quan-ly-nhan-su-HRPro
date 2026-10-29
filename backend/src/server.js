require('dotenv').config();

const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await prisma.$connect();
    console.log('[DB] Ket noi MySQL thanh cong');
    app.listen(PORT, () => {
      console.log(`[SERVER] HRPro Backend chay tai http://localhost:${PORT}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[FATAL] Khong ket noi duoc database:', err.message);
    process.exit(1);
  }
}

start();

// Tat server an toan
['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
);
