const mongoose = require('mongoose');
const winston = require('winston');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ]
});

/**
 * Verbindung zur MongoDB herstellen
 */
const connectMongoDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    
    logger.info('Mit MongoDB verbunden');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB-Verbindungsfehler:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Verbindung zu MongoDB getrennt');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB-Verbindung aufgrund von Anwendungsbeendigung geschlossen');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Fehler beim Verbinden mit MongoDB:', error);
    throw error;
  }
};

/**
 * MongoDB-Verbindung schließen
 */
const closeMongoDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('MongoDB-Verbindung geschlossen');
    }
  } catch (error) {
    logger.error('Fehler beim Schließen der MongoDB-Verbindung:', error);
  }
};

module.exports = {
  connectMongoDB,
  closeMongoDB
}; 