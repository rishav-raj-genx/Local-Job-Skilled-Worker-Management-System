const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Skilled Worker Hub (PS 7) is running!`);
      console.log(`📡 Local URL: http://localhost:${PORT}`);
      console.log(`🔒 Role-Based Access: Customer, Worker, Admin`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
