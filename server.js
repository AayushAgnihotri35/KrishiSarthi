require('dotenv').config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const quotationRoutes = require("./routes/quotations"); 
const cropListingRoutes = require("./routes/cropListings"); 

// Connect DB
connectDB(process.env.MONGO_URI);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS Configuration - Allow requests from GitHub Pages
app.use(cors({
  origin: [
    "https://aayushagnihotri35.github.io",
    "https://aayushagnihotri35.github.io/KrishiSarthi",
    "http://localhost:3000", // For local testing
    "http://127.0.0.1:3000"  // For local testing
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/crop-listings", cropListingRoutes); 

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KrishiSarthi API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register'
      },
      user: '/api/user',
      quotations: '/api/quotations',
      cropListings: '/api/crop-listings'
    },
    frontend: 'https://aayushagnihotri35.github.io/KrishiSarthi/',
    documentation: 'Visit frontend for more information'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    success: true,
    message: 'KrishiSarthi API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbStatus],
      connected: dbStatus === 1
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler - For undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    availableEndpoints: {
      root: '/',
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      quotations: '/api/quotations',
      cropListings: '/api/crop-listings'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 KrishiSarthi Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});