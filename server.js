require('dotenv').config();

const express = require("express");
const cors = require("cors");
const path = require("path");
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
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/crop-listings", cropListingRoutes); 

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'KrishiSarthi API is running',
    timestamp: new Date().toISOString(),
    database: require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 KrishiSarthi Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});