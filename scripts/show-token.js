const mongoose = require('mongoose');
const SelectLineToken = require('../models/selectline-token.model');
require('dotenv').config();

async function showToken() {
  try {
    // MongoDB URI aus der .env-Datei laden
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sfslsync';
    
    // Verbindung zur MongoDB herstellen
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Verbunden mit MongoDB...');

    // Neuesten Token aus der DB holen
    const tokenDoc = await SelectLineToken.findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (tokenDoc) {
      console.log('\nSelectLine Token:');
      console.log('----------------');
      console.log(`Token: ${tokenDoc.token}`);
      console.log(`Erstellt am: ${tokenDoc.createdAt}`);
      console.log(`Läuft ab in: ${Math.round((3600000 - (Date.now() - tokenDoc.createdAt.getTime())) / 1000)} Sekunden`);
    } else {
      console.log('Kein Token in der Datenbank gefunden.');
    }

    // Verbindung schließen
    await mongoose.connection.close();
    console.log('\nMongoDB Verbindung geschlossen.');
  } catch (error) {
    console.error('Fehler beim Abrufen des Tokens:', error);
    process.exit(1);
  }
}

showToken(); 