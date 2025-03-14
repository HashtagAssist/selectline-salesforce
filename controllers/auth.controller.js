const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const { ValidationError } = require('../middlewares/error-handler.middleware');
const emailService = require('../services/email.service');
const winston = require('winston');

// Fehlerklassen, die wir noch definieren müssen
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth-controller.log' })
  ]
});

/**
 * Benutzerregistrierung
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const register = async (req, res, next) => {
  try {
    // Validierung ausführen
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // Detaillierte Validierungsfehler extrahieren
      const validationErrors = errors.array().map(err => ({
        field: err.param,
        value: err.value,
        message: err.msg,
        location: err.location
      }));
      
      // Ausführliches Logging der Validierungsfehler
      logger.warn('Registration validation failed', {
        errors: validationErrors,
        requestBody: req.body
      });
      
      // Fehler werfen mit detaillierten Informationen
      throw new ValidationError(validationErrors);
    }
    
    // Daten extrahieren
    const { username, email, password, passwordConfirm, firstName, lastName, role } = req.body;
    
    // Prüfen, ob Passwörter übereinstimmen
    if (password !== passwordConfirm) {
      logger.warn('Password confirmation failed', { username, email });
      throw new ValidationError([{ 
        field: 'passwordConfirm', 
        message: 'Passwords do not match',
        value: '***hidden***'
      }]);
    }
    
    // Prüfen, ob Benutzer oder E-Mail bereits existieren
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      logger.warn('Registration failed - User already exists', { 
        username, 
        email,
        existingField: existingUser.email === email ? 'email' : 'username'
      });
      
      const errorField = existingUser.email === email ? 'email' : 'username';
      throw new ValidationError([{ 
        field: errorField, 
        message: `This ${errorField} is already registered`,
        value: errorField === 'email' ? email : username
      }]);
    }
    
    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // E-Mail-Verifikationstoken generieren
    const emailVerificationToken = uuidv4();
    
    // Ablaufdatum für Token setzen (24 Stunden)
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);
    
    // Benutzer erstellen
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'user',
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires
    });
    
    // E-Mail-Verifikation senden
    try {
      await emailService.sendVerificationEmail(newUser, emailVerificationToken);
      logger.info('Verification email sent', { email, userId: newUser._id });
    } catch (emailError) {
      logger.error('Failed to send verification email', { 
        error: emailError.message,
        email,
        userId: newUser._id
      });
      // Benutzer trotzdem erstellen, auch wenn E-Mail-Versand fehlschlägt
    }
    
    // Erfolgreiche Registrierung loggen
    logger.info('New user registered', { 
      userId: newUser._id,
      username,
      email
    });
    
    // Antwort senden
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Registration successful. Please check your email to verify your account.',
      userId: newUser._id,
      // Im Entwicklungsmodus den Token direkt zurückgeben, damit Tester ihn verwenden können
      ...(process.env.NODE_ENV !== 'production' && { verificationToken: emailVerificationToken })
    });
    
  } catch (error) {
    // Unerwartete Fehler ausführlich loggen
    if (!(error instanceof ValidationError)) {
      logger.error('Unexpected error during registration', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        requestBody: {
          username: req.body.username,
          email: req.body.email,
          // Sensible Daten werden ausgelassen
        }
      });
    }
    
    next(error);
  }
};

/**
 * Benutzeranmeldung und Token-Erstellung
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const login = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { username, password } = req.body;
    // Benutzer suchen
    const user = await User.findOne({ username });
    if (!user) {
      throw new AuthenticationError('Ungültiger Benutzername oder Passwort');
    }

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Ungültiger Benutzername oder Passwort');
    }

    // JWT-Token erstellen
    const token = generateAccessToken(user);
    
    // Refresh-Token erstellen
    const refreshToken = await generateRefreshToken(user._id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Anmeldung erfolgreich',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Token aktualisieren
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ValidationError('Refresh-Token ist erforderlich');
    }

    // Refresh-Token in der Datenbank suchen
    const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
    
    if (!refreshTokenDoc) {
      throw new AuthenticationError('Ungültiger oder abgelaufener Refresh-Token');
    }

    // Prüfen, ob der Refresh-Token abgelaufen ist
    if (refreshTokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: refreshTokenDoc._id });
      throw new AuthenticationError('Refresh-Token ist abgelaufen');
    }

    // Benutzer suchen
    const user = await User.findById(refreshTokenDoc.userId);
    if (!user) {
      throw new NotFoundError('Benutzer nicht gefunden');
    }

    // Neues Access-Token generieren
    const newAccessToken = generateAccessToken(user);
    
    // Optional: Refresh-Token rotieren
    const newRefreshToken = await generateRefreshToken(user._id);
    await RefreshToken.deleteOne({ _id: refreshTokenDoc._id });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Token erfolgreich aktualisiert',
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Benutzerabmeldung
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Refresh-Token aus der Datenbank entfernen
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Erfolgreich abgemeldet'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Benutzerprofil abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getProfile = async (req, res, next) => {
  try {
    // Benutzer-ID aus dem JWT-Token extrahieren
    const userId = req.user.id;
    // Benutzer suchen
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundError('Benutzer nicht gefunden');
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
};

/**
 * E-Mail-Bestätigung
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Log für Debugging
    logger.info('Email verification attempt', { token });
    
    // Hier würde die eigentliche Implementierung stehen
    // z.B. Finden des Benutzers mit dem Verifikations-Token und Setzen von "emailVerified" auf true
    
    // Beispiel-Implementierung:
    const user = await User.findOne({ emailVerificationToken: token });
    
    if (!user) {
      logger.warn('Invalid email verification token', { token });
      throw new NotFoundError('Invalid or expired verification token');
    }
    
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    
    logger.info('Email successfully verified', { userId: user._id });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Email verification successful. You can now log in.'
    });
  } catch (error) {
    logger.error('Error verifying email', { 
      error: error.message,
      token: req.params.token
    });
    next(error);
  }
};

/**
 * Passwort-Zurücksetzung anfordern
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    logger.info('Password reset requested', { email });
    
    // Benutzer mit der E-Mail suchen
    const user = await User.findOne({ email });
    
    // Auch wenn kein Benutzer gefunden wurde, geben wir eine positive Antwort zurück
    // (aus Sicherheitsgründen, um keine Informationen über existierende E-Mails preiszugeben)
    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'If your email is registered, you will receive password reset instructions.'
      });
    }
    
    // Reset-Token generieren
    const resetToken = uuidv4();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 Stunde gültig
    
    // Token in der Datenbank speichern
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();
    
    // E-Mail für Passwort-Zurücksetzung senden
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      logger.info('Password reset email sent', { email, userId: user._id });
    } catch (emailError) {
      logger.error('Failed to send password reset email', { 
        error: emailError.message,
        email,
        userId: user._id
      });
      // Wir geben trotzdem eine erfolgreiche Antwort zurück, um keine Informationen preiszugeben
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'If your email is registered, you will receive password reset instructions.',
      // Im Entwicklungsmodus den Token direkt zurückgeben, damit Tester ihn verwenden können
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    });
  } catch (error) {
    logger.error('Error requesting password reset', { 
      error: error.message,
      email: req.body.email
    });
    next(error);
  }
};

/**
 * Passwort zurücksetzen mit Token
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    logger.info('Password reset attempt', { token });
    
    // Benutzer mit diesem Token suchen
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });
    
    if (!user) {
      logger.warn('Invalid or expired password reset token', { token });
      throw new NotFoundError('Invalid or expired reset token');
    }
    
    // Passwort hashen und speichern
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    logger.info('Password successfully reset', { userId: user._id });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Your password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    logger.error('Error resetting password', { 
      error: error.message,
      token: req.params.token
    });
    next(error);
  }
};

/**
 * Benutzerprofil aktualisieren
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const updateProfile = async (req, res, next) => {
  try {
    // Benutzer-ID aus dem JWT-Token
    const userId = req.user.id;
    
    // Zu aktualisierende Felder
    const { firstName, lastName, email } = req.body;
    
    logger.info('Profile update requested', { userId });
    
    // Benutzer finden
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Aktualisieren der erlaubten Felder
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    
    // E-Mail-Änderung erfordert spezielle Behandlung (optional: erneute Verifizierung)
    if (email && email !== user.email) {
      // Prüfen, ob die neue E-Mail bereits existiert
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.warn('Email already in use', { email });
        throw new ValidationError([{
          field: 'email',
          message: 'Email is already in use',
          value: email
        }]);
      }
      
      user.email = email;
      // Optional: E-Mail-Verifizierungsprozess starten
      // user.emailVerified = false;
      // user.emailVerificationToken = uuidv4();
    }
    
    await user.save();
    
    logger.info('Profile updated successfully', { userId });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Profile updated successfully',
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
    logger.error('Error updating profile', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Passwort ändern
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const changePassword = async (req, res, next) => {
  try {
    // Benutzer-ID aus dem JWT-Token
    const userId = req.user.id;
    
    // Passwörter aus dem Request-Body
    const { currentPassword, newPassword } = req.body;
    
    logger.info('Password change requested', { userId });
    
    // Benutzer finden
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Aktuelles Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      logger.warn('Current password is incorrect', { userId });
      throw new ValidationError([{
        field: 'currentPassword',
        message: 'Current password is incorrect',
        value: '***hidden***'
      }]);
    }
    
    // Neues Passwort hashen und speichern
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    logger.info('Password changed successfully', { userId });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password', {
      error: error.message,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Access-Token generieren
 * @param {Object} user - Benutzerobjekt
 * @returns {string} JWT-Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  );
};

/**
 * Refresh-Token generieren und in der Datenbank speichern
 * @param {string} userId - Benutzer-ID
 * @returns {string} Refresh-Token
 */
const generateRefreshToken = async (userId) => {
  // Zufälliges Token generieren
  const token = uuidv4();
  
  // Ablaufdatum (30 Tage)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // In der Datenbank speichern
  const refreshToken = new RefreshToken({
    userId,
    token,
    expiresAt
  });

  await refreshToken.save();
  
  return token;
};

/**
 * Benutzer löschen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Überprüfen, ob der Benutzer der Anfragende selbst ist oder Admin-Rechte hat
    const isOwnAccount = req.user.id === userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwnAccount && !isAdmin) {
      throw new AuthenticationError('You are not authorized to delete this user account');
    }
    
    logger.info('User deletion requested', { 
      userId,
      requestedBy: req.user.id,
      isOwnAccount,
      isAdmin
    });
    
    // Benutzer in der Datenbank suchen
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Erst alle abhängigen Daten löschen
    // Zum Beispiel: Refresh-Tokens des Benutzers
    await RefreshToken.deleteMany({ userId });
    
    // Dann den Benutzer selbst löschen
    await User.deleteOne({ _id: userId });
    
    logger.info('User successfully deleted', { 
      deletedUserId: userId,
      username: user.username,
      email: user.email
    });
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User account has been successfully deleted'
    });
  } catch (error) {
    logger.error('Error deleting user', {
      error: error.message,
      userId: req.params.userId,
      requestedBy: req.user?.id
    });
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  changePassword,
  deleteUser
}; 