const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middlewares/error-handler.middleware');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');
const User = require('../models/user.model');
const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcrypt');

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
    .normalizeEmail({
      gmail_remove_dots: false
    }),
  
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
    .normalizeEmail({
      gmail_remove_dots: false
    })
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
router.get('/profile', authenticateJWT, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Aktualisieren des Benutzerprofils
 * @access  Privat
 */
router.put('/profile', authenticateJWT, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Passwortänderung
 * @access  Privat
 */
router.post('/change-password', authenticateJWT, changePasswordValidation, validateRequest, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Benutzerabmeldung (Invalidierung des Refresh-Tokens)
 * @access  Privat
 */
router.post('/logout', authenticateJWT, authController.logout);

/**
 * @route   GET /api/auth/users
 * @desc    Alle Benutzer abrufen (nur für Admins)
 * @access  Privat (Admin)
 */
router.get('/users', authenticateJWT, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/users/:userId
 * @desc    Einen Benutzer nach ID abrufen (nur für Admins)
 * @access  Privat (Admin)
 */
router.get('/users/:userId', authenticateJWT, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'fail',
        message: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/users
 * @desc    Neuen Benutzer erstellen (nur für Admins)
 * @access  Privat (Admin)
 */
router.post('/users', authenticateJWT, authorizeRoles(['admin']), registerValidation, validateRequest, async (req, res, next) => {
  try {
    // Validierungsergebnisse wurden bereits durch validateRequest geprüft
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Überprüfen, ob der Benutzername bereits existiert
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'fail',
        message: 'Benutzername bereits vergeben'
      });
    }
    
    // Überprüfen, ob die E-Mail-Adresse bereits existiert
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'fail',
        message: 'E-Mail-Adresse bereits registriert'
      });
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Neuen Benutzer erstellen
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'user',
      isEmailVerified: true // Bei Admin-Erstellung automatisch verifiziert
    });
    
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Benutzer erfolgreich erstellt',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/users/:userId
 * @desc    Benutzer aktualisieren (nur für Admins)
 * @access  Privat (Admin)
 */
router.put('/users/:userId', authenticateJWT, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { username, email, firstName, lastName, role } = req.body;
    
    // Benutzer suchen
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'fail',
        message: 'Benutzer nicht gefunden'
      });
    }
    
    // Überprüfen, ob der neue Benutzername bereits vergeben ist (falls geändert)
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'fail',
          message: 'Benutzername bereits vergeben'
        });
      }
      user.username = username;
    }
    
    // Überprüfen, ob die neue E-Mail-Adresse bereits registriert ist (falls geändert)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'fail',
          message: 'E-Mail-Adresse bereits registriert'
        });
      }
      user.email = email;
    }
    
    // Weitere Felder aktualisieren
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    
    // Änderungen speichern
    await user.save();
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Benutzer erfolgreich aktualisiert',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/auth/users/:userId/status
 * @desc    Benutzerstatus ändern (aktiv/inaktiv) (nur für Admins)
 * @access  Privat (Admin)
 */
router.patch('/users/:userId/status', authenticateJWT, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    // Benutzer suchen
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'fail',
        message: 'Benutzer nicht gefunden'
      });
    }
    
    // Status aktualisieren
    user.isActive = isActive;
    
    // Änderungen speichern
    await user.save();
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Benutzer wurde ${isActive ? 'aktiviert' : 'deaktiviert'}`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Löscht einen Benutzeraccount
 * @access  Privat (nur eigener Account oder Admin)
 */
router.delete('/users/:userId', authenticateJWT, authController.deleteUser);

module.exports = router; 