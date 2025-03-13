const { validationResult } = require('express-validator');
const winston = require('winston');
const { StatusCodes } = require('http-status-codes');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/validation-errors.log' })
  ]
});

/**
 * Erweiterte Fehlerklasse für Validierungsfehler
 */
class ValidationError extends Error {
  constructor(errors) {
    super('Validation Error');
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

/**
 * Middleware zum Prüfen der Validierungsergebnisse
 * @returns Middleware-Funktion
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Detaillierte Fehler extrahieren
    const extractedErrors = errors.array().map(err => {
      return {
        field: err.param,
        value: err.value,
        message: err.msg,
        location: err.location
      };
    });

    // Ausführliches Logging
    logger.warn('Validation error occurred', {
      path: req.path,
      method: req.method,
      body: req.body,
      errors: extractedErrors
    });

    // Fehler mit detaillierten Informationen erstellen
    const validationError = new ValidationError(extractedErrors);
    
    return next(validationError);
  }
  
  next();
};

/**
 * Formatiert einen Fehler für die API-Antwort
 * @param {Error} err - Der aufgetretene Fehler
 * @returns {Object} Formatierter Fehler
 */
exports.formatError = (err) => {
  // Standardfehlerantwort
  const formattedError = {
    status: 'error',
    message: err.message || 'An error occurred'
  };

  // Bei Validierungsfehlern die Details hinzufügen
  if (err instanceof ValidationError) {
    formattedError.errors = err.errors;
  }

  // In Entwicklungsumgebung mehr Details hinzufügen
  if (process.env.NODE_ENV !== 'production') {
    formattedError.stack = err.stack;
  }

  return formattedError;
};

/**
 * Exportiere die ValidationError-Klasse
 */
exports.ValidationError = ValidationError; 