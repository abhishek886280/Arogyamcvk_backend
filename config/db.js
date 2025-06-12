// arogya-mcvk/backend/config/db.js
const mongoose = require('mongoose');
// Correctly load .env relative to the backend directory where this script might be called from or server.js is located.
// __dirname refers to the directory of the current module (config), so ../ goes up to backend/.
require('dotenv').config({ path: __dirname + '/../.env' });

/**
 * Connects to the MongoDB database.
 * Uses the MONGO_URI environment variable for the connection string.
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI not found in environment variables. Please check your .env file.');
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6 deprecated useCreateIndex and useFindAndModify, so they are not needed.
    });
    console.log('MongoDB Connected successfully...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure if database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;