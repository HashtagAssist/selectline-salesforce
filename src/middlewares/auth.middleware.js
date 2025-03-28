const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

/**
 * Middleware zur JWT-Validierung
 * Prüft, ob ein gültiges JWT-Token im Authorization-Header vorhanden ist
 */
const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Zugriff verweigert: Kein Authorization-Header oder falsches Format', {
        ip: req.ip,
        path: req.path
      });
      
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Zugriff verweigert. Bitte melden Sie sich an.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          logger.warn('Zugriff verweigert: Token abgelaufen', {
            ip: req.ip,
            path: req.path
          });
          
          return res.status(StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Token abgelaufen. Bitte melden Sie sich erneut an.'
          });
        }
        
        logger.warn(`Zugriff verweigert: Ungültiges Token (${err.message})`, {
          ip: req.ip,
          path: req.path
        });
        
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'Ungültiges Token. Bitte melden Sie sich erneut an.'
        });
      }
      
      // Token ist gültig, decodierte Daten an Request-Objekt anhängen
      req.user = decoded;
      logger.debug('JWT-Authentifizierung erfolgreich', {
        userId: decoded.id,
        path: req.path
      });
      
      next();
    });
  } catch (error) {
    logger.error('Fehler bei der JWT-Authentifizierung:', error);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Interner Serverfehler bei der Authentifizierung'
    });
  }
};

/**
 * Middleware zur Rollenprüfung
 * Prüft, ob der authentifizierte Benutzer die erforderlichen Rollen hat
 * @param {string[]} roles - Array mit erlaubten Rollen
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Zugriff verweigert: Nicht authentifiziert', {
        ip: req.ip,
        path: req.path
      });
      
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Nicht authentifiziert. Bitte melden Sie sich an.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Zugriff verweigert: Unzureichende Berechtigungen', {
        ip: req.ip,
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });
      
      return res.status(StatusCodes.FORBIDDEN).json({
        status: 'error',
        message: 'Sie haben keine Berechtigung für diese Aktion.'
      });
    }
    
    logger.debug('Rollenprüfung erfolgreich', {
      userId: req.user.id,
      userRole: req.user.role,
      path: req.path
    });
    
    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
}; 