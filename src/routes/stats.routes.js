const express = require('express');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');
const statsController = require('../controllers/stats.controller');
const User = require('../models/user.model'); // Benutzermodell importieren

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
    // Echte Benutzerstatistiken aus der Datenbank abrufen
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // Kürzlich registrierte Benutzer (letzte 7 Tage)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentRegistrations = await User.countDocuments({ 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    // Login-Aktivität der letzten 7 Tage
    // In einer realen Anwendung würde man ein separates Login-Log-Modell verwenden
    // Hier simulieren wir die Aktivität basierend auf lastLogin-Timestamps
    const loginHistory = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const count = await User.countDocuments({
        lastLogin: { $gte: day, $lt: nextDay }
      });
      
      loginHistory.push(count);
    }
    
    // Heute eingeloggte Benutzer
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const loginsToday = await User.countDocuments({
      lastLogin: { $gte: today }
    });
    
    // Eingeloggte Benutzer diese Woche
    const loginsThisWeek = await User.countDocuments({
      lastLogin: { $gte: oneWeekAgo }
    });
    
    const userStats = {
      total: totalUsers,
      active: activeUsers,
      admins: adminUsers,
      recentRegistrations: recentRegistrations,
      loginActivity: {
        today: loginsToday,
        week: loginsThisWeek,
        history: loginHistory
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