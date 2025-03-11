const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');
const { fetchERPData, updateERPData, createERPData } = require('../services/erp.service');
const { setCache, getCache, deleteCache, deleteCachePattern } = require('../services/redis.service');
const { ValidationError, NotFoundError, ExternalAPIError } = require('../utils/error.handler');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/erp-controller.log' })
  ]
});

/**
 * Kunden aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getKunden = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { limit = 25, offset = 0, search = '' } = req.query;
    
    // Cache-Schlüssel basierend auf den Abfrageparametern erstellen
    const cacheKey = `erp:kunden:${limit}:${offset}:${search}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Kundeninformationen aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (search) {
      params.search = search;
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/customers', params, cacheKey);
    
    logger.info(`${apiResponse.items?.length || 0} Kunden vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response) {
      // Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Einen bestimmten Kunden aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getKundeById = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Cache-Schlüssel erstellen
    const cacheKey = `erp:kunde:${id}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Kundeninformation aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/customers/${id}`, {}, cacheKey);
    
    if (!apiResponse) {
      throw new NotFoundError(`Kunde mit ID ${id} nicht gefunden`);
    }
    
    logger.info(`Kunde mit ID ${id} vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      next(new NotFoundError(`Kunde mit ID ${req.params.id} nicht gefunden`));
    } else if (error.response) {
      // Anderer Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Artikel aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getArtikel = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { limit = 25, offset = 0, search = '' } = req.query;
    
    // Cache-Schlüssel basierend auf den Abfrageparametern erstellen
    const cacheKey = `erp:artikel:${limit}:${offset}:${search}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Artikelinformationen aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (search) {
      params.search = search;
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/items', params, cacheKey);
    
    logger.info(`${apiResponse.items?.length || 0} Artikel vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response) {
      // Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Einen bestimmten Artikel aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getArtikelById = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Cache-Schlüssel erstellen
    const cacheKey = `erp:artikel:${id}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Artikelinformation aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/items/${id}`, {}, cacheKey);
    
    if (!apiResponse) {
      throw new NotFoundError(`Artikel mit ID ${id} nicht gefunden`);
    }
    
    logger.info(`Artikel mit ID ${id} vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      next(new NotFoundError(`Artikel mit ID ${req.params.id} nicht gefunden`));
    } else if (error.response) {
      // Anderer Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Belege aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getBelege = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { 
      typ = '', 
      von = '', 
      bis = '', 
      limit = 25, 
      offset = 0 
    } = req.query;
    
    // Cache-Schlüssel basierend auf den Abfrageparametern erstellen
    const cacheKey = `erp:belege:${typ}:${von}:${bis}:${limit}:${offset}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Beleginformationen aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (typ) params.type = typ;
    if (von) params.dateFrom = von;
    if (bis) params.dateTo = bis;
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/documents', params, cacheKey);
    
    logger.info(`${apiResponse.items?.length || 0} Belege vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response) {
      // Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Einen bestimmten Beleg aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getBelegById = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Cache-Schlüssel erstellen
    const cacheKey = `erp:beleg:${id}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Beleginformation aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/documents/${id}`, {}, cacheKey);
    
    if (!apiResponse) {
      throw new NotFoundError(`Beleg mit ID ${id} nicht gefunden`);
    }
    
    logger.info(`Beleg mit ID ${id} vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      next(new NotFoundError(`Beleg mit ID ${req.params.id} nicht gefunden`));
    } else if (error.response) {
      // Anderer Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Aufträge aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getAuftraege = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { 
      status = '', 
      von = '', 
      bis = '', 
      limit = 25, 
      offset = 0 
    } = req.query;
    
    // Cache-Schlüssel basierend auf den Abfrageparametern erstellen
    const cacheKey = `erp:auftraege:${status}:${von}:${bis}:${limit}:${offset}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Auftragsinformationen aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Parameter für die ERP-API-Anfrage
    const params = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    };
    
    if (status) params.status = status;
    if (von) params.dateFrom = von;
    if (bis) params.dateTo = bis;
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData('/api/orders', params, cacheKey);
    
    logger.info(`${apiResponse.items?.length || 0} Aufträge vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response) {
      // Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Einen bestimmten Auftrag aus dem ERP-System abrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getAuftragById = async (req, res, next) => {
  try {
    // Validierung der Eingabedaten
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validierungsfehler', errors.array());
    }

    const { id } = req.params;
    
    // Cache-Schlüssel erstellen
    const cacheKey = `erp:auftrag:${id}`;
    
    // Zunächst versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.debug(`Auftragsinformation aus dem Cache abgerufen: ${cacheKey}`);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        cached: true,
        data: cachedData
      });
    }
    
    // Daten vom ERP-System abrufen
    const apiResponse = await fetchERPData(`/api/orders/${id}`, {}, cacheKey);
    
    if (!apiResponse) {
      throw new NotFoundError(`Auftrag mit ID ${id} nicht gefunden`);
    }
    
    logger.info(`Auftrag mit ID ${id} vom ERP-System abgerufen`);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      cached: false,
      data: apiResponse
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      next(new NotFoundError(`Auftrag mit ID ${req.params.id} nicht gefunden`));
    } else if (error.response) {
      // Anderer Fehler von der ERP-API
      next(new ExternalAPIError(
        error.message,
        { 
          status: error.response.status,
          data: error.response.data
        },
        'ERP'
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Cache für ERP-Daten aktualisieren
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const refreshCache = async (req, res, next) => {
  try {
    const { entity, id } = req.body;
    
    if (entity && id) {
      // Spezifischen Cache-Eintrag löschen
      await deleteCache(`erp:${entity}:${id}`);
      logger.info(`Cache für ${entity} mit ID ${id} gelöscht`);
    } else if (entity) {
      // Alle Cache-Einträge für eine bestimmte Entität löschen
      await deleteCachePattern(`erp:${entity}:*`);
      logger.info(`Cache für alle ${entity} gelöscht`);
    } else {
      // Alle ERP-bezogenen Cache-Einträge löschen
      await deleteCachePattern('erp:*');
      logger.info('Gesamter ERP-Cache gelöscht');
    }
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Cache erfolgreich aktualisiert'
    });
  } catch (error) {
    logger.error('Fehler beim Aktualisieren des Cache:', error);
    next(error);
  }
};

module.exports = {
  getKunden,
  getKundeById,
  getArtikel,
  getArtikelById,
  getBelege,
  getBelegById,
  getAuftraege,
  getAuftragById,
  refreshCache
}; 