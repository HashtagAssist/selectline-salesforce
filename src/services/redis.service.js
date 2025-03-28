const { createClient } = require('redis');
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
    new winston.transports.File({ filename: 'logs/redis.log' })
  ]
});

// Redis-Client erstellen
let redisClient;

/**
 * Redis-Verbindung herstellen
 */
const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (err) => {
      logger.error('Redis-Fehler:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Mit Redis verbunden');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Verbindung zu Redis wird wiederhergestellt...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Fehler beim Verbinden mit Redis:', error);
    throw error;
  }
};

/**
 * Daten im Cache speichern
 * @param {string} key - Schlüssel für den Cache-Eintrag
 * @param {any} data - Zu speichernde Daten
 * @param {number} ttl - Time-to-live in Sekunden (optional)
 */
const setCache = async (key, data, ttl = null) => {
  try {
    const ttlValue = ttl || parseInt(process.env.REDIS_TTL, 10) || 3600;
    const stringData = JSON.stringify(data);
    await redisClient.setEx(key, ttlValue, stringData);
    logger.debug(`Daten für Schlüssel ${key} im Cache gespeichert (TTL: ${ttlValue}s)`);
    return true;
  } catch (error) {
    logger.error(`Fehler beim Speichern von Daten im Cache für Schlüssel ${key}:`, error);
    return false;
  }
};

/**
 * Daten aus dem Cache abrufen
 * @param {string} key - Schlüssel des Cache-Eintrags
 * @returns {Promise<any|null>} - Die gespeicherten Daten oder null
 */
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) {
      logger.debug(`Kein Cache-Eintrag für Schlüssel ${key} gefunden`);
      return null;
    }
    
    logger.debug(`Cache-Eintrag für Schlüssel ${key} abgerufen`);
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Fehler beim Abrufen von Daten aus dem Cache für Schlüssel ${key}:`, error);
    return null;
  }
};

/**
 * Cache-Eintrag löschen
 * @param {string} key - Schlüssel des zu löschenden Cache-Eintrags
 */
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    logger.debug(`Cache-Eintrag für Schlüssel ${key} gelöscht`);
    return true;
  } catch (error) {
    logger.error(`Fehler beim Löschen des Cache-Eintrags für Schlüssel ${key}:`, error);
    return false;
  }
};

/**
 * Alle Cache-Einträge mit einem bestimmten Muster löschen
 * @param {string} pattern - Muster für die zu löschenden Schlüssel
 */
const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`${keys.length} Cache-Einträge mit Muster ${pattern} gelöscht`);
    }
    return true;
  } catch (error) {
    logger.error(`Fehler beim Löschen von Cache-Einträgen mit Muster ${pattern}:`, error);
    return false;
  }
};

/**
 * Redis-Client schließen
 */
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis-Verbindung geschlossen');
    }
  } catch (error) {
    logger.error('Fehler beim Schließen der Redis-Verbindung:', error);
  }
};

module.exports = {
  connectRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  closeRedis
}; 