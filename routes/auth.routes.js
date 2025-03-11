const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrierung eines neuen Benutzers
 * @access  Öffentlich
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Der Benutzername muss zwischen 3 und 30 Zeichen lang sein'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Das Passwort muss mindestens 6 Zeichen lang sein')
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Benutzeranmeldung und Token-Erstellung
 * @access  Öffentlich
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
    body('password')
      .notEmpty()
      .withMessage('Bitte geben Sie Ihr Passwort ein')
  ],
  authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Aktualisieren des JWT-Tokens
 * @access  Öffentlich (mit gültigem Refresh-Token)
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Benutzerabmeldung (Invalidierung des Refresh-Tokens)
 * @access  Privat
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Abrufen des Benutzerprofils
 * @access  Privat
 */
router.get('/profile', authController.getProfile);

module.exports = router; 