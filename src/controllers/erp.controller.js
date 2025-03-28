const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');
const selectLineService = require('../services/selectline-auth.service');
const redis = require('../services/redis.service');

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

// Cache TTL in seconds (30 minutes)
const CACHE_TTL = 30 * 60;

/**
 * Get customers from SelectLine
 */
const getKunden = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { limit = 20, offset = 0, search = '' } = req.query;
    const cacheKey = `kunden:${limit}:${offset}:${search}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build query params
    const params = {
      limit,
      offset
    };

    if (search) {
      params.search = search;
    }

    // Get customers from SelectLine
    const response = await selectLineService.get('/customers', params);
    
    // Cache the results
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching customers from SelectLine', { error: error.message });
    next(error);
  }
};

/**
 * Get a customer by ID
 */
const getKundeById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const cacheKey = `kunde:${id}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get customer from SelectLine
    const response = await selectLineService.get(`/customers/${id}`);
    
    // Cache the result
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching customer by ID from SelectLine', { 
      error: error.message,
      customerId: req.params.id 
    });
    next(error);
  }
};

/**
 * Get products from SelectLine
 */
const getArtikel = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { limit = 20, offset = 0, search = '' } = req.query;
    const cacheKey = `artikel:${limit}:${offset}:${search}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build query params
    const params = {
      limit,
      offset
    };

    if (search) {
      params.search = search;
    }

    // Get products from SelectLine
    const response = await selectLineService.get('/articles', params);
    
    // Cache the results
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching articles from SelectLine', { error: error.message });
    next(error);
  }
};

/**
 * Get a product by ID
 */
const getArtikelById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const cacheKey = `artikel:${id}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get product from SelectLine
    const response = await selectLineService.get(`/articles/${id}`);
    
    // Cache the result
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching article by ID from SelectLine', { 
      error: error.message,
      articleId: req.params.id 
    });
    next(error);
  }
};

/**
 * Get documents from SelectLine
 */
const getBelege = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { typ, von, bis, limit = 20, offset = 0 } = req.query;
    const cacheKey = `belege:${typ || ''}:${von || ''}:${bis || ''}:${limit}:${offset}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build query params
    const params = {
      limit,
      offset
    };

    if (typ) params.type = typ;
    if (von) params.from = von;
    if (bis) params.to = bis;

    // Get documents from SelectLine
    const response = await selectLineService.get('/documents', params);
    
    // Cache the results
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching documents from SelectLine', { error: error.message });
    next(error);
  }
};

/**
 * Get a document by ID
 */
const getBelegById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const cacheKey = `beleg:${id}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get document from SelectLine
    const response = await selectLineService.get(`/documents/${id}`);
    
    // Cache the result
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching document by ID from SelectLine', { 
      error: error.message,
      documentId: req.params.id 
    });
    next(error);
  }
};

/**
 * Get orders from SelectLine
 */
const getAuftraege = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { status, von, bis, limit = 20, offset = 0 } = req.query;
    const cacheKey = `auftraege:${status || ''}:${von || ''}:${bis || ''}:${limit}:${offset}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build query params
    const params = {
      limit,
      offset
    };

    if (status) params.status = status;
    if (von) params.from = von;
    if (bis) params.to = bis;

    // Get orders from SelectLine
    const response = await selectLineService.get('/orders', params);
    
    // Cache the results
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching orders from SelectLine', { error: error.message });
    next(error);
  }
};

/**
 * Get an order by ID
 */
const getAuftragById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const cacheKey = `auftrag:${id}`;

    // Try to get from cache first
    const cachedData = await redis.client.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get order from SelectLine
    const response = await selectLineService.get(`/orders/${id}`);
    
    // Cache the result
    await redis.client.set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);
    
    res.json(response.data);
  } catch (error) {
    logger.error('Error fetching order by ID from SelectLine', { 
      error: error.message,
      orderId: req.params.id 
    });
    next(error);
  }
};

/**
 * Refresh the cache
 */
const refreshCache = async (req, res, next) => {
  try {
    // Delete all keys with prefix 'kunde', 'artikel', 'beleg', 'auftrag'
    const keys = await redis.client.keys('kunde:*');
    keys.push(...await redis.client.keys('artikel:*'));
    keys.push(...await redis.client.keys('beleg:*'));
    keys.push(...await redis.client.keys('auftrag:*'));
    
    if (keys.length > 0) {
      await redis.client.del(keys);
    }
    
    res.status(StatusCodes.OK).json({
      message: 'Cache successfully refreshed'
    });
  } catch (error) {
    logger.error('Error refreshing cache', { error: error.message });
    next(error);
  }
};

/**
 * Get a new token from SelectLine
 */
const getSelectLineToken = async (req, res, next) => {
  try {
    const token = await selectLineService.getToken();
    res.json({
      status: 'success',
      data: {
        token
      }
    });
  } catch (error) {
    // Detailliertes Error-Logging
    logger.error('Error getting SelectLine token', { 
      error: error.message,
      stack: error.stack,
      response: error.response?.data, // SelectLine API Antwort
      status: error.response?.status,
      headers: error.response?.headers
    });

    // Fehlerantwort basierend auf dem API-Fehler
    const statusCode = error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR;
    const errorMessage = error.response?.data?.message || 'Fehler beim Abrufen des SelectLine Tokens';
    
    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        apiError: error.response?.data,
        errorCode: error.code,
        request: error
      } : undefined
    });
  }
};

/**
 * Logout von SelectLine
 */
const logoutSelectLine = async (req, res, next) => {
  try {
    await selectLineService.logout().then(response => {
      res.status(StatusCodes.ACCEPTED).json({
        status: 'success',
        message: 'Erfolgreich von SelectLine abgemeldet',
        slMessage: response
      });
    }).catch(error => {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Fehler beim Abmelden von SelectLine'
      });
    });
  } catch (error) {
    logger.error('Error logging out from SelectLine', { 
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    next(error);
  }
};

// Export all functions
module.exports = {
  getKunden,
  getKundeById,
  getArtikel,
  getArtikelById,
  getBelege,
  getBelegById,
  getAuftraege,
  getAuftragById,
  refreshCache,
  getSelectLineToken,
  logoutSelectLine
}; 