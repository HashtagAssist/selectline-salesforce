const express = require('express');
const { StatusCodes } = require('http-status-codes');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/logs/system
 * @desc    Liefert System-Logs
 * @access  Privat
 */
router.get('/system', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für System-Logs
    const systemLogs = generateMockLogs('system', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 235,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(235 / (parseInt(req.query.limit) || 25))
      },
      data: systemLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/api
 * @desc    Liefert API-Logs
 * @access  Privat
 */
router.get('/api', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für API-Logs
    const apiLogs = generateMockLogs('api', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 427,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(427 / (parseInt(req.query.limit) || 25))
      },
      data: apiLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/error
 * @desc    Liefert Fehler-Logs
 * @access  Privat
 */
router.get('/error', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für Fehler-Logs
    const errorLogs = generateMockLogs('error', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 94,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(94 / (parseInt(req.query.limit) || 25))
      },
      data: errorLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/auth
 * @desc    Liefert Authentifizierungs-Logs
 * @access  Privat
 */
router.get('/auth', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für Auth-Logs
    const authLogs = generateMockLogs('auth', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 182,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(182 / (parseInt(req.query.limit) || 25))
      },
      data: authLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/database
 * @desc    Liefert Datenbank-Logs
 * @access  Privat
 */
router.get('/database', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für Datenbank-Logs
    const dbLogs = generateMockLogs('database', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 315,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(315 / (parseInt(req.query.limit) || 25))
      },
      data: dbLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/redis
 * @desc    Liefert Redis-Logs
 * @access  Privat
 */
router.get('/redis', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für Redis-Logs
    const redisLogs = generateMockLogs('redis', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 127,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(127 / (parseInt(req.query.limit) || 25))
      },
      data: redisLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/email
 * @desc    Liefert E-Mail-Logs
 * @access  Privat
 */
router.get('/email', authenticateJWT, async (req, res, next) => {
  try {
    // Mock-Daten für E-Mail-Logs
    const emailLogs = generateMockLogs('email', req.query);

    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: 78,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 25,
        pages: Math.ceil(78 / (parseInt(req.query.limit) || 25))
      },
      data: emailLogs
    });
  } catch (error) {
    next(error);
  }
});

// Hilfsfunktion zur Generierung von Mock-Logs
function generateMockLogs(type, query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 25;
  const logCount = limit;
  
  const logs = [];
  
  // Nachrichtenvorlagen basierend auf Log-Typ
  const messageTemplates = {
    system: [
      'System started',
      'System stopped',
      'Configuration loaded',
      'Service {service} restarted',
      'CPU usage high: {value}%',
      'Memory usage high: {value}%',
      'Disk space low: {value}GB remaining'
    ],
    api: [
      'API call: GET {endpoint}',
      'API call: POST {endpoint}',
      'API call: PUT {endpoint}',
      'API call: DELETE {endpoint}',
      'API rate limit reached for IP {ip}',
      'API response time: {value}ms'
    ],
    error: [
      'Error: {message}',
      'Exception in module {module}: {message}',
      'Stack trace: {trace}',
      'Database error: {message}',
      'Network error: Connection to {endpoint} failed'
    ],
    auth: [
      'User {username} logged in',
      'User {username} logged out',
      'Failed login attempt for user {username}',
      'Password reset requested for {email}',
      'User {username} changed password',
      'User {username} created',
      'User {username} account locked after multiple failed attempts'
    ],
    database: [
      'Query executed: {query}',
      'Database connection established',
      'Database connection lost',
      'Slow query detected: {query} ({value}ms)',
      'Database backup started',
      'Database backup completed',
      'Database migration applied: {migration}'
    ],
    redis: [
      'Redis connected',
      'Redis disconnected',
      'Cache hit for key {key}',
      'Cache miss for key {key}',
      'Cache invalidated for key {key}',
      'Redis command: {command}',
      'Redis memory usage: {value}MB'
    ],
    email: [
      'Email sent to {email}',
      'Email delivery failed to {email}',
      'Email template {template} rendered',
      'Email queue processed',
      'Email bounce received from {email}',
      'Email open tracked for {email}'
    ]
  };
  
  // Services, Endpunkte, Module, etc. für die Generierung
  const services = ['web', 'api', 'worker', 'scheduler', 'redis'];
  const endpoints = ['/api/auth/login', '/api/users', '/api/products', '/api/orders', '/api/webhooks'];
  const modules = ['auth', 'database', 'api', 'file', 'email'];
  const usernames = ['admin', 'john.doe', 'jane.smith', 'test.user', 'editor'];
  const emails = ['admin@example.com', 'john@example.com', 'jane@example.com', 'test@example.com'];
  const ips = ['192.168.1.1', '10.0.0.5', '172.16.0.10', '8.8.8.8'];
  const emailTemplates = ['welcome', 'password-reset', 'notification', 'invoice', 'report'];
  const statusCodes = type === 'error' ? [400, 401, 403, 404, 500] : [200, 201, 204, 400, 401, 404, 500];
  
  // Zufälliges Element aus einem Array
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // Zufällige Zahl zwischen min und max
  const randomValue = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Zufälliges Datum in der Vergangenheit (bis zu 7 Tagen)
  const randomDate = () => new Date(Date.now() - randomValue(0, 7 * 24 * 60 * 60 * 1000));
  
  // Zufälliges Log-Level basierend auf dem Typ
  const getRandomLevel = (type) => {
    if (type === 'error') return 'error';
    
    const levels = ['info', 'debug', 'warn', 'error'];
    const weights = type === 'system' ? [40, 30, 20, 10] : [60, 20, 15, 5];
    
    let total = 0;
    const threshold = Math.random() * 100;
    
    for (let i = 0; i < levels.length; i++) {
      total += weights[i];
      if (threshold <= total) return levels[i];
    }
    
    return 'info';
  };
  
  const currentTemplates = messageTemplates[type] || messageTemplates.system;
  
  for (let i = 0; i < logCount; i++) {
    const level = getRandomLevel(type);
    let message = randomItem(currentTemplates);
    
    // Platzhalter im Template ersetzen
    message = message
      .replace('{service}', randomItem(services))
      .replace('{endpoint}', randomItem(endpoints))
      .replace('{module}', randomItem(modules))
      .replace('{username}', randomItem(usernames))
      .replace('{email}', randomItem(emails))
      .replace('{ip}', randomItem(ips))
      .replace('{template}', randomItem(emailTemplates))
      .replace('{value}', randomValue(1, 100))
      .replace('{query}', 'SELECT * FROM users WHERE id = 1')
      .replace('{command}', 'GET user:1')
      .replace('{key}', 'user:1')
      .replace('{migration}', '2023_03_14_create_users_table')
      .replace('{message}', 'Something went wrong')
      .replace('{trace}', 'Error at line 42 in module.js');
    
    const log = {
      _id: `log_${Date.now()}_${i}`,
      timestamp: randomDate(),
      level: level,
      message: message,
      source: type,
      metadata: {}
    };
    
    // Spezifische Metadaten je nach Log-Typ
    if (type === 'api') {
      log.endpoint = randomItem(endpoints);
      log.method = randomItem(['GET', 'POST', 'PUT', 'DELETE']);
      log.statusCode = randomItem(statusCodes);
      log.responseTime = randomValue(5, 2000);
      log.ip = randomItem(ips);
    } else if (type === 'auth') {
      log.username = randomItem(usernames);
      log.ip = randomItem(ips);
      log.success = Math.random() > 0.2; // 80% erfolgreiche Anmeldungen
    }
    
    logs.push(log);
  }
  
  return logs;
}

module.exports = router; 