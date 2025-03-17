require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');

// Verbindung zur Datenbank herstellen
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Mit MongoDB verbunden');
    return true;
  } catch (error) {
    logger.error('Fehler bei der Verbindung zur MongoDB:', error);
    return false;
  }
}

// Collections für Dashboard-Daten
const collections = [
  'apicalls',
  'errors',
  'transformations',
  'webhooks',
  'systemmetrics',
  'configs'
];

// Alle Dashboard-Daten löschen
async function clearDashboardData() {
  const isConnected = await connectToDatabase();
  
  if (!isConnected) {
    logger.error('Datenbank-Verbindung konnte nicht hergestellt werden.');
    process.exit(1);
  }
  
  try {
    // Jede Collection leeren
    for (const collection of collections) {
      if (mongoose.connection.collections[collection]) {
        const result = await mongoose.connection.collections[collection].deleteMany({});
        logger.info(`Collection ${collection} geleert: ${result.deletedCount} Dokumente gelöscht`);
      } else {
        logger.warn(`Collection ${collection} existiert nicht in der Datenbank`);
      }
    }
    
    logger.info('Alle Dashboard-Daten wurden erfolgreich gelöscht');
  } catch (error) {
    logger.error('Fehler beim Löschen der Dashboard-Daten:', error);
  } finally {
    // Verbindung zur Datenbank schließen
    await mongoose.connection.close();
    logger.info('Verbindung zur MongoDB geschlossen');
  }
}

// Skript ausführen
clearDashboardData(); 