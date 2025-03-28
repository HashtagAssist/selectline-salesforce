const { StatusCodes } = require('http-status-codes');

/**
 * Benutzerdefinierte Fehlerklasse für API-Fehler
 */
class APIError extends Error {
  /**
   * @param {string} message - Fehlermeldung
   * @param {number} statusCode - HTTP-Statuscode
   * @param {any} details - Optionale Fehlerdetails
   */
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Fehlerklasse für Validierungsfehler
 */
class ValidationError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   * @param {any} details - Validierungsfehlerdetails
   */
  constructor(message, details) {
    super(message, StatusCodes.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

/**
 * Fehlerklasse für Authentifizierungsfehler
 */
class AuthenticationError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   */
  constructor(message = 'Nicht authentifiziert. Bitte melden Sie sich an.') {
    super(message, StatusCodes.UNAUTHORIZED);
    this.name = 'AuthenticationError';
  }
}

/**
 * Fehlerklasse für Berechtigungsfehler
 */
class ForbiddenError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   */
  constructor(message = 'Sie haben keine Berechtigung für diese Aktion.') {
    super(message, StatusCodes.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

/**
 * Fehlerklasse für "Nicht gefunden"-Fehler
 */
class NotFoundError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   */
  constructor(message = 'Ressource nicht gefunden.') {
    super(message, StatusCodes.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

/**
 * Fehlerklasse für Konflikte (z.B. bereits existierende Ressourcen)
 */
class ConflictError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   */
  constructor(message = 'Die Anfrage konnte aufgrund eines Konflikts nicht abgeschlossen werden.') {
    super(message, StatusCodes.CONFLICT);
    this.name = 'ConflictError';
  }
}

/**
 * Fehlerklasse für externe API-Fehler
 */
class ExternalAPIError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   * @param {any} details - Fehlerdetails
   * @param {string} source - Quelle des Fehlers (z.B. 'ERP', 'Salesforce')
   */
  constructor(message, details, source) {
    super(
      `Fehler bei der Kommunikation mit ${source}: ${message}`,
      StatusCodes.BAD_GATEWAY,
      details
    );
    this.name = 'ExternalAPIError';
    this.source = source;
  }
}

/**
 * Fehlerklasse für Datenbank-Fehler
 */
class DatabaseError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   * @param {any} details - Fehlerdetails
   */
  constructor(message, details) {
    super(`Datenbankfehler: ${message}`, StatusCodes.INTERNAL_SERVER_ERROR, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Fehlerklasse für Rate-Limiting
 */
class RateLimitError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   */
  constructor(message = 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.') {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
    this.name = 'RateLimitError';
  }
}

/**
 * Fehlerklasse für Timeout-Fehler
 */
class TimeoutError extends APIError {
  /**
   * @param {string} message - Fehlermeldung
   * @param {string} operation - Die Operation, die zum Timeout führte
   */
  constructor(message = 'Die Anfrage hat das Zeitlimit überschritten.', operation = '') {
    super(
      operation ? `Timeout bei ${operation}: ${message}` : message,
      StatusCodes.GATEWAY_TIMEOUT
    );
    this.name = 'TimeoutError';
  }
}

module.exports = {
  APIError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ExternalAPIError,
  DatabaseError,
  RateLimitError,
  TimeoutError
}; 