const app = require('./app');

const PORT = process.env.PORT || 5000;

// Global unhandled rejection safety net
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle port-in-use error cleanly instead of a hard crash
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to free it: npx kill-port ${PORT}`);
    console.error(`   Or set a different PORT= in your .env file.\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
