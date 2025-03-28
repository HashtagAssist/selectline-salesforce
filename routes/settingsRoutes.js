const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateJWT } = require('../middlewares/auth.middleware');

// Alle Routen erfordern Authentifizierung
router.use(authenticateJWT);

// Einstellungen abrufen
router.get('/', settingsController.getSettings);

// Einstellungen aktualisieren
router.put('/', settingsController.updateSettings);

module.exports = router; 