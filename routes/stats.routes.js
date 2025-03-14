const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');
const statsController = require('../controllers/stats.controller');

const router = express.Router();

/**
 * @route   GET /api/stats/dashboard
 * @desc    Liefert allgemeine Statistiken für das Dashboard
 * @access  Privat
 */
router.get('/dashboard', authenticateJWT, statsController.getDashboardStats);

/**
 * @route   GET /api/stats/api-calls
 * @desc    Liefert detaillierte Statistiken zu API-Aufrufen
 * @access  Privat
 */
router.get('/api-calls', authenticateJWT, statsController.getApiCallStats);

/**
 * @route   GET /api/stats/system
 * @desc    Liefert Systemstatistiken
 * @access  Privat
 */
router.get('/system', authenticateJWT, statsController.getSystemStats);

/**
 * @route   GET /api/stats/users
 * @desc    Liefert Benutzerstatistiken (nur für Admins)
 * @access  Privat (Admin)
 */
router.get('/users', authenticateJWT, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    // Benutzerdaten würden in einer echten Anwendung aus der Datenbank abgerufen werden
    // Für die Demo verwenden wir weiterhin Mock-Daten
    const userStats = {
      total: 24,
      active: 21,
      admins: 3,
      recentRegistrations: 5,
      loginActivity: {
        today: 18,
        week: 22,
        history: [15, 18, 17, 20, 19, 21, 18]
      }
    };

    res.status(200).json({
      status: 'success',
      data: userStats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stats/transformations
 * @desc    Liefert Transformationsstatistiken 
 * @access  Privat
 */
router.get('/transformations', authenticateJWT, statsController.getTransformationStats);

/**
 * @route   GET /api/stats/webhooks
 * @desc    Liefert Webhook-Statistiken 
 * @access  Privat
 */
router.get('/webhooks', authenticateJWT, statsController.getWebhookStats);

module.exports = router; 