// Global error handler for unhandled exceptions
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION - shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

// Global handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION - shutting down...');
  console.error('Reason:', reason);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Load and expand environment variables
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

// Import database connection
const { connectToMongoDB } = require('./config/database');

// Import routes
const inventoryRoutes = require('./routes/inventory');

// Initialize express app
const app = express();

const port = process.env.PORT || 5000;

// Configure middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    mongo: mongoStatus
  });
});

// API routes
app.use('/api/inventory', inventoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error status and message
  const status = err.status || 500;
  let message = err.message || 'Something went wrong';
  
  // In development, include more error details
  const details = process.env.NODE_ENV === 'production' 
    ? {} 
    : {
        stack: err.stack,
        code: err.code,
        name: err.name
      };
  
  // Special handling for MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    message = 'Failed to connect to MongoDB. Please check your connection settings and ensure MongoDB is running.';
  }
  
  // Send the error response
  res.status(status).json({
    error: true,
    message: message,
    ...details
  });
}); // MISSING CLOSING BRACE WAS HERE

// Connect to MongoDB then start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Run host validation on startup
    console.log('Validating inventory...');
    try {
      if (typeof inventoryRoutes.ensureHostsExist === 'function') {
        const result = await inventoryRoutes.ensureHostsExist();
        console.log(`Host validation complete. Found ${result.total} hosts referenced in groups. Created ${result.created} new host entries.`);
      } else {
        console.log('Host validation function not available, skipping...');
      }
    } catch (validationError) {
      console.error('Error during inventory validation:', validationError);
      // Continue starting the server despite validation error
    }
    
    // Start the server
    const server = app.listen(port, () => {
      console.log(`API server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();