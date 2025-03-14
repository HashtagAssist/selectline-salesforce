const express = require('express');
const { body, param } = require('express-validator');
const webhookController = require('../controllers/webhook.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const router = express.Router();

// Routen mit Authentifizierung
/**
 * @route   GET /api/webhooks/list
 * @desc    Liste aller Webhooks abrufen
 * @access  Privat
 */
router.get(
  '/list',
  authenticateJWT,
  webhookController.getWebhookList
);

/**
 * @route   GET /api/webhooks/:id
 * @desc    Details eines bestimmten Webhooks abrufen
 * @access  Privat
 */
router.get(
  '/:id',
  authenticateJWT,
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Webhook-ID ist erforderlich')
  ],
  webhookController.getWebhookById
);

/**
 * @route   POST /api/webhooks
 * @desc    Neuen Webhook erstellen
 * @access  Privat
 */
router.post(
  '/',
  authenticateJWT,
  [
    body('name')
      .isString()
      .notEmpty()
      .withMessage('Name ist erforderlich'),
    body('url')
      .isURL()
      .withMessage('Gültige URL ist erforderlich'),
    body('events')
      .isString()
      .notEmpty()
      .withMessage('Events sind erforderlich'),
  ],
  webhookController.createWebhook
);

/**
 * @route   PUT /api/webhooks/:id
 * @desc    Bestehenden Webhook aktualisieren
 * @access  Privat
 */
router.put(
  '/:id',
  authenticateJWT,
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Webhook-ID ist erforderlich'),
    body('name')
      .isString()
      .notEmpty()
      .withMessage('Name ist erforderlich'),
    body('url')
      .isURL()
      .withMessage('Gültige URL ist erforderlich'),
    body('events')
      .isString()
      .notEmpty()
      .withMessage('Events sind erforderlich'),
  ],
  webhookController.updateWebhook
);

/**
 * @route   DELETE /api/webhooks/:id
 * @desc    Webhook löschen
 * @access  Privat
 */
router.delete(
  '/:id',
  authenticateJWT,
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Webhook-ID ist erforderlich')
  ],
  webhookController.deleteWebhook
);

/**
 * @route   GET /api/webhooks/:id/logs
 * @desc    Logs für einen bestimmten Webhook abrufen
 * @access  Privat
 */
router.get(
  '/:id/logs',
  authenticateJWT,
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Webhook-ID ist erforderlich')
  ],
  webhookController.getWebhookLogs
);

// Öffentliche Webhook-Endpunkte für externe Systeme

/**
 * @route   POST /api/webhooks/salesforce/account
 * @desc    Verarbeiten von Salesforce Account-Events
 * @access  Öffentlich (mit Salesforce-Signatur-Verifizierung)
 */
router.post(
  '/salesforce/account',
  [
    body()
      .notEmpty()
      .withMessage('Der Request-Body darf nicht leer sein')
  ],
  webhookController.handleAccountEvent
);

/**
 * @route   POST /api/webhooks/salesforce/opportunity
 * @desc    Verarbeiten von Salesforce Opportunity-Events
 * @access  Öffentlich (mit Salesforce-Signatur-Verifizierung)
 */
router.post(
  '/salesforce/opportunity',
  [
    body()
      .notEmpty()
      .withMessage('Der Request-Body darf nicht leer sein')
  ],
  webhookController.handleOpportunityEvent
);

/**
 * @route   POST /api/webhooks/salesforce/product
 * @desc    Verarbeiten von Salesforce Product-Events
 * @access  Öffentlich (mit Salesforce-Signatur-Verifizierung)
 */
router.post(
  '/salesforce/product',
  [
    body()
      .notEmpty()
      .withMessage('Der Request-Body darf nicht leer sein')
  ],
  webhookController.handleProductEvent
);

/**
 * @route   POST /api/webhooks/salesforce/contact
 * @desc    Verarbeiten von Salesforce Contact-Events
 * @access  Öffentlich (mit Salesforce-Signatur-Verifizierung)
 */
router.post(
  '/salesforce/contact',
  [
    body()
      .notEmpty()
      .withMessage('Der Request-Body darf nicht leer sein')
  ],
  webhookController.handleContactEvent
);

/**
 * @route   POST /api/webhooks/salesforce/custom
 * @desc    Verarbeiten von benutzerdefinierten Salesforce-Events
 * @access  Öffentlich (mit Salesforce-Signatur-Verifizierung)
 */
router.post(
  '/salesforce/custom',
  [
    body()
      .notEmpty()
      .withMessage('Der Request-Body darf nicht leer sein'),
    body('event_type')
      .isString()
      .notEmpty()
      .withMessage('Event-Typ ist erforderlich')
  ],
  webhookController.handleCustomEvent
);

module.exports = router; 