const express = require('express');
const { body } = require('express-validator');
const webhookController = require('../controllers/webhook.controller');
const router = express.Router();

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