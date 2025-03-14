const express = require('express');
const { param, query, body } = require('express-validator');
const transformationController = require('../controllers/transformation.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const router = express.Router();

// Alle Transformationsrouten benötigen Authentifizierung
router.use(authenticateJWT);

/**
 * @route   GET /api/transform/kunden-zu-accounts
 * @desc    Kunden aus dem ERP-System in Salesforce Account-Format umwandeln
 * @access  Privat
 */
router.get(
  '/kunden-zu-accounts',
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
  transformationController.transformKundenZuAccounts
);

/**
 * @route   GET /api/transform/kunden-zu-accounts/:id
 * @desc    Einen bestimmten Kunden in Salesforce Account-Format umwandeln
 * @access  Privat
 */
router.get(
  '/kunden-zu-accounts/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Kunden-ID ist erforderlich')
  ],
  transformationController.transformKundeZuAccount
);

/**
 * @route   GET /api/transform/artikel-zu-products
 * @desc    Artikel aus dem ERP-System in Salesforce Product-Format umwandeln
 * @access  Privat
 */
router.get(
  '/artikel-zu-products',
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
  transformationController.transformArtikelZuProducts
);

/**
 * @route   GET /api/transform/artikel-zu-products/:id
 * @desc    Einen bestimmten Artikel in Salesforce Product-Format umwandeln
 * @access  Privat
 */
router.get(
  '/artikel-zu-products/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Artikel-ID ist erforderlich')
  ],
  transformationController.transformArtikelZuProduct
);

/**
 * @route   GET /api/transform/auftraege-zu-opportunities
 * @desc    Aufträge aus dem ERP-System in Salesforce Opportunity-Format umwandeln
 * @access  Privat
 */
router.get(
  '/auftraege-zu-opportunities',
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
  transformationController.transformAuftraegeZuOpportunities
);

/**
 * @route   GET /api/transform/auftraege-zu-opportunities/:id
 * @desc    Einen bestimmten Auftrag in Salesforce Opportunity-Format umwandeln
 * @access  Privat
 */
router.get(
  '/auftraege-zu-opportunities/:id',
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Auftrags-ID ist erforderlich')
  ],
  transformationController.transformAuftragZuOpportunity
);

/**
 * @route   POST /api/transform/custom
 * @desc    Benutzerdefinierte Datentransformation mit angegebenem Mapping
 * @access  Privat
 */
router.post(
  '/custom',
  [
    body('sourceData')
      .isObject()
      .withMessage('Quelldaten müssen ein Objekt sein'),
    body('mapping')
      .isObject()
      .withMessage('Mapping muss ein Objekt sein')
  ],
  transformationController.customTransformation
);

module.exports = router; 