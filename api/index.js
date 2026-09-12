const app = require('../app');
const { connectDB } = require('../config/db');

let dbConnected = false;

module.exports = async (req, res) => {
  try {
    if (!dbConnected) {
      await connectDB();
      dbConnected = true;
    }
    return app(req, res);
  } catch (err) {
    console.error('Serverless function error:', err);
    res.status(500).json({
      error: 'Server initialization failed',
      message: process.env.NODE_ENV === 'production'
        ? 'Service temporarily unavailable. Please try again.'
        : err.message
    });
  }
};
