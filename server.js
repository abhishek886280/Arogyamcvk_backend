// arogya-mcvk/backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Database connection function
const patientRoutes = require('./routes/patients'); // Patient API routes
const authRoutes = require('./routes/auth'); // Authentication API routes

// Load environment variables from .env file. 
// This should be one of the first things to ensure all modules have access to env vars.
dotenv.config({ path: __dirname + '/.env' });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// Enable CORS (Cross-Origin Resource Sharing)
// For production, restrict origins: app.use(cors({ origin: 'https://your-netlify-domain.com' }));
app.use(cors({ origin: 'https://mcvk.netlify.app' })); 

// Body Parser Middleware to handle JSON and URL-encoded data
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads

// Define a simple route for the API root (optional, for health check)
app.get('/', (req, res) => {
  res.send('Arogya@MCVK API is running...');
});

// Mount API routes
app.use('/api/auth', authRoutes);         // Authentication routes (e.g., /api/auth/login, /api/auth/register)
app.use('/api/patients', patientRoutes); // Patient data routes (e.g., /api/patients)


// Define the port for the server
const PORT = process.env.PORT || 5001; // Use port from .env or default to 5001

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});