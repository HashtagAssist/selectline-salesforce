const mongoose = require('mongoose');
const SelectLineToken = require('../models/selectline-token.model');
require('dotenv').config();

async function showToken() {
  try {
    // Verbindung zur Datenbank herstellen
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Neuesten Token aus der DB holen
    const tokenDoc = await SelectLineToken.findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (tokenDoc) {
      console.log('\nSelectLine Token gefunden:');
      console.log('------------------------');
      console.log('Token:', tokenDoc.token);
      console.log('Erstellt am:', tokenDoc.createdAt);
      console.log('------------------------\n');
    } else {
      console.log('\nKein Token in der Datenbank gefunden!\n');
    }

    // Verbindung trennen
    await mongoose.connection.close();
  } catch (error) {
    console.error('Fehler beim Abrufen des Tokens:', error.message);
    process.exit(1);
  }
}

// Skript ausführen
showToken(); 