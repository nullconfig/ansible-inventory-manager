const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 10,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000
};

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    // Try different ways to get the MongoDB URI
    let mongoUri = process.env.MONGODB_URI;
    
    // If not found in environment, try to load from .env file directly
    if (!mongoUri) {
      console.log('MONGODB_URI not found in environment, trying to load from .env file...');
      
      try {
        // Try to load from .env in current directory
        if (fs.existsSync('.env')) {
          const envConfig = fs.readFileSync('.env', 'utf8');
          const match = envConfig.match(/MONGODB_URI=(.*)/);
          if (match && match[1]) {
            mongoUri = match[1].trim();
            console.log('Found MONGODB_URI in .env file');
          }
        }
        
        // Try to load from .env in parent directory
        if (!mongoUri && fs.existsSync(path.join('..', '.env'))) {
          const envConfig = fs.readFileSync(path.join('..', '.env'), 'utf8');
          const match = envConfig.match(/MONGODB_URI=(.*)/);
          if (match && match[1]) {
            mongoUri = match[1].trim();
            console.log('Found MONGODB_URI in parent directory .env file');
          }
        }
      } catch (err) {
        console.warn('Error reading .env file:', err.message);
      }
    }
    
    // If still not found, try a fallback
    if (!mongoUri) {
      // Check if we're running in Docker
      if (fs.existsSync('/.dockerenv')) {
        console.log('Running in Docker, checking for mounted .env file...');
        // Common Docker mount locations for .env file
        const possiblePaths = [
          '/app/.env',
          '/usr/src/app/.env',
          '/var/www/.env'
        ];
        
        for (const envPath of possiblePaths) {
          if (fs.existsSync(envPath)) {
            try {
              const envConfig = fs.readFileSync(envPath, 'utf8');
              const match = envConfig.match(/MONGODB_URI=(.*)/);
              if (match && match[1]) {
                mongoUri = match[1].trim();
                console.log(`Found MONGODB_URI in ${envPath}`);
                break;
              }
            } catch (err) {
              console.warn(`Error reading ${envPath}:`, err.message);
            }
          }
        }
      }
    }
    
    // Final check if we have a MongoDB URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined and could not be found in any .env file');
    }
    
    // Process any potential interpolation variables in MongoDB URI
    if (mongoUri.includes('${') && mongoUri.includes('}')) {
      console.log('Processing environment variables in MONGODB_URI...');
      
      // Get all environment variables
      const envVars = process.env;
      
      // Replace all ${VAR} occurrences with their values
      Object.keys(envVars).forEach(key => {
        const placeholder = '${' + key + '}';
        if (mongoUri.includes(placeholder)) {
          mongoUri = mongoUri.replace(new RegExp(placeholder, 'g'), envVars[key]);
          console.log(`Replaced ${placeholder} in MONGODB_URI`);
        }
      });
      
      // Log a warning if there are still unresolved variables
      if (mongoUri.includes('${') && mongoUri.includes('}')) {
        console.warn('Warning: MONGODB_URI contains unresolved variables:', 
                    mongoUri.match(/\${[^}]+}/g));
      }
    }
    
    // For security, don't log the full URI with credentials
    const sanitizedUri = mongoUri.replace(/:\/\/[^@]+@/, '://***:***@');
    console.log(`Connecting to MongoDB at ${sanitizedUri.split('@')[1] || 'mongodb'}`);
    
    await mongoose.connect(mongoUri, mongooseOptions);
    
    console.log('MongoDB connected successfully');
    
    // Log connection events
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.info('MongoDB reconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    // Exit with failure in production, or continue in development for hot reloading
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = {
  connectToMongoDB
};