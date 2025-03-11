const axios = require('axios');
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
    new winston.transports.File({ filename: 'logs/salesforce.log' })
  ]
});

// Salesforce API-Einstellungen
let accessToken = null;
let instanceUrl = null;
let tokenExpiry = null;

/**
 * Salesforce OAuth2-Authentifizierung
 * @returns {Promise<string>} - Access Token für Salesforce API
 */
const authenticateSalesforce = async () => {
  try {
    // Prüfen, ob ein gültiges Token vorhanden ist
    const now = new Date();
    if (accessToken && tokenExpiry && now < tokenExpiry) {
      return { accessToken, instanceUrl };
    }
    
    logger.info('Authentifizierung bei Salesforce...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', process.env.SALESFORCE_CLIENT_ID);
    params.append('client_secret', process.env.SALESFORCE_CLIENT_SECRET);
    params.append('username', process.env.SALESFORCE_USERNAME);
    params.append('password', process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    
    const response = await axios.post(
      `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      instanceUrl = response.data.instance_url;
      // Token-Ablaufzeit setzen (typischerweise 2 Stunden)
      tokenExpiry = new Date(now.getTime() + 7200 * 1000);
      
      logger.info('Erfolgreich bei Salesforce authentifiziert');
      return { accessToken, instanceUrl };
    } else {
      throw new Error('Authentifizierung fehlgeschlagen: Kein Token in der Antwort');
    }
  } catch (error) {
    logger.error('Fehler bei der Authentifizierung mit Salesforce:', error.message);
    throw new Error(`Salesforce-Authentifizierungsfehler: ${error.message}`);
  }
};

/**
 * Daten von Salesforce abrufen
 * @param {string} endpoint - API-Endpunkt (z.B. '/services/data/v55.0/sobjects/Account')
 * @param {Object} params - Query-Parameter für die Anfrage
 * @returns {Promise<any>} - Die API-Antwort
 */
const fetchSalesforceData = async (endpoint, params = {}) => {
  try {
    logger.info(`Abrufen von Daten von Salesforce: ${endpoint}`);
    
    const { accessToken, instanceUrl } = await authenticateSalesforce();
    
    const response = await axios.get(`${instanceUrl}${endpoint}`, {
      params,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Fehler beim Abrufen von Daten von Salesforce (${endpoint}):`, error.message);
    throw error;
  }
};

/**
 * Daten in Salesforce erstellen
 * @param {string} endpoint - API-Endpunkt (z.B. '/services/data/v55.0/sobjects/Account')
 * @param {Object} data - Zu erstellende Daten
 * @returns {Promise<any>} - Die API-Antwort
 */
const createSalesforceData = async (endpoint, data) => {
  try {
    logger.info(`Erstellen von Daten in Salesforce: ${endpoint}`);
    
    const { accessToken, instanceUrl } = await authenticateSalesforce();
    
    const response = await axios.post(`${instanceUrl}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Fehler beim Erstellen von Daten in Salesforce (${endpoint}):`, error.message);
    throw error;
  }
};

/**
 * Daten in Salesforce aktualisieren
 * @param {string} endpoint - API-Endpunkt (z.B. '/services/data/v55.0/sobjects/Account/001xx000003DGb2AAG')
 * @param {Object} data - Zu aktualisierende Daten
 * @returns {Promise<void>} - Die API-Antwort
 */
const updateSalesforceData = async (endpoint, data) => {
  try {
    logger.info(`Aktualisieren von Daten in Salesforce: ${endpoint}`);
    
    const { accessToken, instanceUrl } = await authenticateSalesforce();
    
    await axios.patch(`${instanceUrl}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // PATCH-Anfragen geben keinen Inhalt zurück bei Erfolg
    return { success: true };
  } catch (error) {
    logger.error(`Fehler beim Aktualisieren von Daten in Salesforce (${endpoint}):`, error.message);
    throw error;
  }
};

/**
 * Daten in Salesforce löschen
 * @param {string} endpoint - API-Endpunkt (z.B. '/services/data/v55.0/sobjects/Account/001xx000003DGb2AAG')
 * @returns {Promise<void>} - Die API-Antwort
 */
const deleteSalesforceData = async (endpoint) => {
  try {
    logger.info(`Löschen von Daten in Salesforce: ${endpoint}`);
    
    const { accessToken, instanceUrl } = await authenticateSalesforce();
    
    await axios.delete(`${instanceUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // DELETE-Anfragen geben keinen Inhalt zurück bei Erfolg
    return { success: true };
  } catch (error) {
    logger.error(`Fehler beim Löschen von Daten in Salesforce (${endpoint}):`, error.message);
    throw error;
  }
};

/**
 * SOQL-Abfrage in Salesforce ausführen
 * @param {string} query - SOQL-Abfrage
 * @returns {Promise<any>} - Die Abfrageergebnisse
 */
const executeSoqlQuery = async (query) => {
  try {
    logger.info('Ausführen einer SOQL-Abfrage in Salesforce');
    
    const encodedQuery = encodeURIComponent(query);
    return await fetchSalesforceData(`/services/data/v55.0/query?q=${encodedQuery}`);
  } catch (error) {
    logger.error('Fehler beim Ausführen einer SOQL-Abfrage in Salesforce:', error.message);
    throw error;
  }
};

module.exports = {
  fetchSalesforceData,
  createSalesforceData,
  updateSalesforceData,
  deleteSalesforceData,
  executeSoqlQuery
}; 