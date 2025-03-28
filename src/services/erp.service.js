const axios = require('axios');
const winston = require('winston');
const { setCache, getCache } = require('./redis.service');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/erp.log' })
  ]
});

// Axios-Instanz für SelectLine ERP API
const erpAPI = axios.create({
  baseURL: process.env.ERP_API_BASE_URL,
  timeout: parseInt(process.env.ERP_API_TIMEOUT, 10) || 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

let authToken = null;
let tokenExpiry = null;

/**
 * Bei der SelectLine API authentifizieren
 * @returns {Promise<string>} Auth-Token
 */
const authenticateERP = async () => {
  try {
    // Prüfen, ob ein gültiges Token vorhanden ist
    const now = new Date();
    if (authToken && tokenExpiry && now < tokenExpiry) {
      return authToken;
    }
    
    logger.info('Authentifizierung bei SelectLine ERP API...');
    
    const response = await erpAPI.post('/auth/login', {
      username: process.env.ERP_API_USERNAME,
      password: process.env.ERP_API_PASSWORD
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      // Token-Ablaufzeit auf 1 Stunde ab jetzt setzen (abhängig von der API-Konfiguration)
      tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      
      logger.info('Erfolgreich bei der SelectLine ERP API authentifiziert');
      return authToken;
    } else {
      throw new Error('Authentifizierung fehlgeschlagen: Kein Token in der Antwort');
    }
  } catch (error) {
    logger.error('Fehler bei der Authentifizierung mit der SelectLine ERP API:', error.message);
    throw new Error(`Authentifizierungsfehler: ${error.message}`);
  }
};

/**
 * API-Anfrage mit automatischer Wiederholung bei Fehlern
 * @param {Function} apiCall - Die auszuführende API-Anfrage-Funktion
 * @returns {Promise<any>} - Die API-Antwort
 */
const executeWithRetry = async (apiCall) => {
  const maxRetries = parseInt(process.env.ERP_API_MAX_RETRIES, 10) || 3;
  let retries = 0;
  let lastError;

  while (retries <= maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Prüfen, ob der Fehler wiederholbar ist (Netzwerkfehler oder bestimmte HTTP-Statuscodes)
      const isRetryable = (
        !error.response || 
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        (error.response && (error.response.status === 429 || error.response.status >= 500))
      );
      
      if (!isRetryable || retries >= maxRetries) {
        break;
      }
      
      // Exponentielles Backoff: 2^retries * 1000 ms
      const delay = Math.pow(2, retries) * 1000;
      logger.warn(`API-Anfrage fehlgeschlagen (Versuch ${retries + 1}/${maxRetries + 1}). Wiederholung in ${delay}ms...`, {
        error: error.message,
        status: error.response?.status
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
      
      // Bei Authentifizierungsfehlern neu authentifizieren
      if (error.response && error.response.status === 401) {
        authToken = null;
        await authenticateERP();
      }
    }
  }
  
  // Alle Wiederholungsversuche erschöpft
  logger.error(`API-Anfrage nach ${maxRetries + 1} Versuchen fehlgeschlagen`, {
    error: lastError.message,
    status: lastError.response?.status
  });
  
  throw lastError;
};

/**
 * Daten aus dem Cache abrufen oder von der API laden
 * @param {string} endpoint - API-Endpunkt 
 * @param {Object} params - Anfrageparameter
 * @param {string} cacheKey - Cache-Schlüssel (optional)
 * @param {number} cacheTTL - Cache-Lebensdauer in Sekunden (optional)
 * @returns {Promise<any>} - Die API-Antwort
 */
const fetchERPData = async (endpoint, params = {}, cacheKey = null, cacheTTL = null) => {
  try {
    // Cache-Schlüssel erstellen, falls nicht angegeben
    const effectiveCacheKey = cacheKey || `erp:${endpoint}:${JSON.stringify(params)}`;
    
    // Versuchen, Daten aus dem Cache zu laden
    const cachedData = await getCache(effectiveCacheKey);
    if (cachedData) {
      logger.debug(`Daten für ${endpoint} aus dem Cache geladen`);
      return cachedData;
    }
    
    logger.info(`Fetching data from SelectLine ERP API: ${endpoint}`);
    
    // Sicherstellen, dass ein gültiges Token vorhanden ist
    const token = await authenticateERP();
    
    // API-Anfrage mit Wiederholungsversuchen ausführen
    const apiCall = async () => {
      const response = await erpAPI.get(endpoint, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    };
    
    const data = await executeWithRetry(apiCall);
    
    // Daten im Cache speichern
    if (data) {
      await setCache(effectiveCacheKey, data, cacheTTL);
    }
    
    return data;
  } catch (error) {
    logger.error(`Fehler beim Abrufen von Daten vom Endpunkt ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Aktualisierung von Daten im ERP-System
 * @param {string} endpoint - API-Endpunkt
 * @param {Object} data - Zu sendende Daten
 * @returns {Promise<any>} - Die API-Antwort
 */
const updateERPData = async (endpoint, data) => {
  try {
    logger.info(`Aktualisieren von Daten im SelectLine ERP API: ${endpoint}`);
    
    // Sicherstellen, dass ein gültiges Token vorhanden ist
    const token = await authenticateERP();
    
    // API-Anfrage mit Wiederholungsversuchen ausführen
    const apiCall = async () => {
      const response = await erpAPI.put(endpoint, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    };
    
    return await executeWithRetry(apiCall);
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren von Daten am Endpunkt ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Erstellung von Daten im ERP-System
 * @param {string} endpoint - API-Endpunkt
 * @param {Object} data - Zu sendende Daten
 * @returns {Promise<any>} - Die API-Antwort
 */
const createERPData = async (endpoint, data) => {
  try {
    logger.info(`Erstellen von Daten im SelectLine ERP API: ${endpoint}`);
    
    // Sicherstellen, dass ein gültiges Token vorhanden ist
    const token = await authenticateERP();
    
    // API-Anfrage mit Wiederholungsversuchen ausführen
    const apiCall = async () => {
      const response = await erpAPI.post(endpoint, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    };
    
    return await executeWithRetry(apiCall);
  } catch (error) {
    logger.error(`Fehler beim Erstellen von Daten am Endpunkt ${endpoint}:`, error.message);
    throw error;
  }
};

module.exports = {
  fetchERPData,
  updateERPData,
  createERPData
}; 