const Settings = require('../models/Settings');

// Alle Einstellungen abrufen
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Abrufen der Einstellungen', error: error.message });
  }
};

// Einstellungen aktualisieren
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.updateSettings(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Einstellungen', error: error.message });
  }
}; 