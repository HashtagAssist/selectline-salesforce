const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const { ValidationError, AuthenticationError, NotFoundError } = require('../utils/error.handler');

/**
 * Benutzerregistrierung
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const register = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        status: 'error',
        message: 'Diese E-Mail-Adresse ist bereits registriert'
      });
    }

    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Benutzer erstellen
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user' // Standardrolle
    });

    await user.save();

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Benutzer erfolgreich registriert',
      data: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
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

    const { email, password } = req.body;

    // Benutzer suchen
    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthenticationError('Ungültige E-Mail-Adresse oder Passwort');
    }

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Ungültige E-Mail-Adresse oder Passwort');
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

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
}; 