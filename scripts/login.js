const mongoose = require('mongoose');
const SelectLineAuthService = require('../services/selectline-auth.service');
require('dotenv').config();

async function login() {
  try {
    // MongoDB URI aus der .env-Datei laden
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sfslsync';
    
    // Verbindung zur MongoDB herstellen
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Verbunden mit MongoDB...');

    // Login durchführen
    const token = await SelectLineAuthService.login();
    
    console.log('\nLogin erfolgreich!');
    console.log('----------------');
    console.log(`Token: ${token}`);
    console.log('\nToken wurde in der Datenbank gespeichert.');

    // Verbindung schließen
    await mongoose.connection.close();
    console.log('\nMongoDB Verbindung geschlossen.');
  } catch (error) {
    console.error('Fehler beim Login:', error);
    process.exit(1);
  }
}

login(); 