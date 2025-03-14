const express = require('express');
const { query, param } = require('express-validator');
const erpController = require('../controllers/erp.controller');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');
const router = express.Router();

// Alle ERP-Routen benötigen Authentifizierung
router.use(authenticateJWT);

/**
 * @route   GET /api/erp/kunden
 * @desc    Kunden aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/kunden',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit muss zwischen 1 und 100 liegen'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset muss eine positive Zahl sein'),
    query('search')
      .optional()
      .isString()
  ],
  erpController.getKunden
);

/**
 * @route   GET /api/erp/kunden/:id
 * @desc    Einen bestimmten Kunden aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/kunden/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Kunden-ID ist erforderlich')
  ],
  erpController.getKundeById
);

/**
 * @route   GET /api/erp/artikel
 * @desc    Artikel aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/artikel',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit muss zwischen 1 und 100 liegen'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset muss eine positive Zahl sein'),
    query('search')
      .optional()
      .isString()
  ],
  erpController.getArtikel
);

/**
 * @route   GET /api/erp/artikel/:id
 * @desc    Einen bestimmten Artikel aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/artikel/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Artikel-ID ist erforderlich')
  ],
  erpController.getArtikelById
);

/**
 * @route   GET /api/erp/belege
 * @desc    Belege aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/belege',
  [
    query('typ')
      .optional()
      .isString()
      .withMessage('Belegtyp muss ein String sein'),
    query('von')
      .optional()
      .isISO8601()
      .withMessage('Von-Datum muss im ISO-Format sein'),
    query('bis')
      .optional()
      .isISO8601()
      .withMessage('Bis-Datum muss im ISO-Format sein'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit muss zwischen 1 und 100 liegen'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset muss eine positive Zahl sein')
  ],
  erpController.getBelege
);

/**
 * @route   GET /api/erp/belege/:id
 * @desc    Einen bestimmten Beleg aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/belege/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Beleg-ID ist erforderlich')
  ],
  erpController.getBelegById
);

/**
 * @route   GET /api/erp/auftraege
 * @desc    Aufträge aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/auftraege',
  [
    query('status')
      .optional()
      .isString()
      .withMessage('Status muss ein String sein'),
    query('von')
      .optional()
      .isISO8601()
      .withMessage('Von-Datum muss im ISO-Format sein'),
    query('bis')
      .optional()
      .isISO8601()
      .withMessage('Bis-Datum muss im ISO-Format sein'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit muss zwischen 1 und 100 liegen'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset muss eine positive Zahl sein')
  ],
  erpController.getAuftraege
);

/**
 * @route   GET /api/erp/auftraege/:id
 * @desc    Einen bestimmten Auftrag aus dem ERP-System abrufen
 * @access  Privat
 */
router.get(
  '/auftraege/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Auftrags-ID ist erforderlich')
  ],
  erpController.getAuftragById
);

/**
 * @route   POST /api/erp/cache-refresh
 * @desc    Cache für ERP-Daten aktualisieren (nur für Administratoren)
 * @access  Admin
 */
router.post(
  '/cache-refresh',
  authorizeRoles(['admin']),
  erpController.refreshCache
);

module.exports = router; 