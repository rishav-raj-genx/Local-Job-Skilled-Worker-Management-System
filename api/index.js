const app = require('../app');
const { connectDB } = require('../config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('Serverless DB connection error:', err);
    res.status(500).send('Database connection error in serverless environment.');
  }
};
