require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');
const RefreshToken = require('./models/refreshToken.model');

// Korrekte MongoDB-Verbindungszeichenfolge verwenden
const MONGO_URI = 'mongodb://localhost:27017/erp_salesforce_middleware';

async function deleteUserByEmail(email) {
  try {
    console.log(`Versuche, Benutzer mit E-Mail ${email} zu löschen...`);
    
    // Mit der Datenbank verbinden
    await mongoose.connect(MONGO_URI);
    console.log('Verbindung zur Datenbank hergestellt');
    
    // Benutzer suchen
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`Kein Benutzer mit der E-Mail ${email} gefunden.`);
      process.exit(0);
    }
    
    console.log(`Benutzer gefunden: ${user._id}, ${user.username}`);
    
    // Refresh-Tokens löschen
    const deletedTokens = await RefreshToken.deleteMany({ userId: user._id });
    console.log(`${deletedTokens.deletedCount} Refresh-Tokens gelöscht`);
    
    // Benutzer löschen
    const result = await User.deleteOne({ _id: user._id });
    console.log(`Benutzer gelöscht: ${result.deletedCount}`);
    
    console.log('Vorgang abgeschlossen');
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
  } finally {
    // Verbindung schließen
    await mongoose.disconnect();
    process.exit(0);
  }
}

// E-Mail des zu löschenden Benutzers
deleteUserByEmail('philipp.rien@ergoflix.de'); 