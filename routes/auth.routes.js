const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middlewares/error-handler.middleware');

const router = express.Router();

/**
 * Validierungsregeln für die Registrierung
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"')
];

/**
 * Validierungsregeln für die Anmeldung
 */
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validierungsregeln für die Passwort-Zurücksetzung
 */
const passwordResetValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validierungsregeln für die Passwort-Zurücksetzung-Bestätigung
 */
const passwordResetConfirmValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

/**
 * Validierungsregeln für die Passwortänderung
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('newPasswordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * @route   POST /api/auth/register
 * @desc    Registrierung eines neuen Benutzers
 * @access  Öffentlich
 */
router.post('/register', registerValidation, validateRequest, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Benutzeranmeldung und Token-Erstellung
 * @access  Öffentlich
 */
router.post('/login', loginValidation, validateRequest, authController.login);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    E-Mail-Bestätigung
 * @access  Öffentlich
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/auth/password-reset
 * @desc    Passwort-Zurücksetzung
 * @access  Öffentlich
 */
router.post('/password-reset', passwordResetValidation, validateRequest, authController.requestPasswordReset);

/**
 * @route   POST /api/auth/password-reset/:token
 * @desc    Passwort-Zurücksetzung-Bestätigung
 * @access  Öffentlich
 */
router.post('/password-reset/:token', passwordResetConfirmValidation, validateRequest, authController.resetPassword);

/**
 * @route   POST /api/auth/refresh
 * @desc    Aktualisieren des JWT-Tokens
 * @access  Öffentlich (mit gültigem Refresh-Token)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Abrufen des Benutzerprofils
 * @access  Privat
 */
router.get('/profile', authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Aktualisieren des Benutzerprofils
 * @access  Privat
 */
router.put('/profile', authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Passwortänderung
 * @access  Privat
 */
router.post('/change-password', changePasswordValidation, validateRequest, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Benutzerabmeldung (Invalidierung des Refresh-Tokens)
 * @access  Privat
 */
router.post('/logout', authController.logout);

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Löscht einen Benutzeraccount
 * @access  Privat (nur eigener Account oder Admin)
 */
router.delete('/users/:userId', authController.deleteUser);

module.exports = router; 