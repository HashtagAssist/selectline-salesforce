const express = require('express');
const { StatusCodes } = require('http-status-codes');
const { authenticateJWT, authorizeRoles } = require('../middlewares/auth.middleware');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Festlegen des Pfads zum Log-Verzeichnis
const LOG_DIR = path.join(process.cwd(), 'logs');

/**
 * Liest Log-Dateien und gibt paginierte Ergebnisse zurück
 * @param {string} logFile - Dateiname der Log-Datei
 * @param {object} query - Query-Parameter für Paginierung und Filter
 * @returns {object} Paginierte Log-Einträge
 */
async function readLogFile(logFile, query) {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 25;
    const filePath = path.join(LOG_DIR, logFile);
    
    // Prüfen, ob die Datei existiert
    try {
      await fs.access(filePath);
    } catch (error) {
      return {
        total: 0,
        page,
        limit,
        pages: 0,
        logs: []
      };
    }
    
    // Log-Datei einlesen
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Alle gültigen JSON-Logs extrahieren
    const logs = fileContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log !== null);
    
    // Filter anwenden, falls vorhanden
    let filteredLogs = [...logs];
    
    if (query.level) {
      filteredLogs = filteredLogs.filter(log => log.level === query.level);
    }
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        (log.message && log.message.toLowerCase().includes(searchTerm)) ||
        (log.path && log.path.toLowerCase().includes(searchTerm)) ||
        (JSON.stringify(log).toLowerCase().includes(searchTerm))
      );
    }
    
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
    }
    
    // Nach Zeitstempel absteigend sortieren (neueste zuerst)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginierung berechnen
    const total = filteredLogs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      logs: paginatedLogs
    };
  } catch (error) {
    console.error(`Fehler beim Lesen der Log-Datei ${logFile}:`, error);
    throw error;
  }
}

/**
 * @route   GET /api/logs/system
 * @desc    Liefert System-Logs
 * @access  Privat
 */
router.get('/system', authenticateJWT, async (req, res, next) => {
  try {
    const result = await readLogFile('combined.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/api
 * @desc    Liefert API-Logs aus der combined.log
 * @access  Privat
 */
router.get('/api', authenticateJWT, async (req, res, next) => {
  try {
    const modifiedQuery = {
      ...req.query,
      search: req.query.search || 'API',
    };
    
    const result = await readLogFile('combined.log', modifiedQuery);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
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
    const result = await readLogFile('error.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
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
    const result = await readLogFile('auth.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
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
    const result = await readLogFile('database.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
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
    const result = await readLogFile('redis.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
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
    const result = await readLogFile('email-service.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/erp
 * @desc    Liefert ERP-Logs
 * @access  Privat
 */
router.get('/erp', authenticateJWT, async (req, res, next) => {
  try {
    const result = await readLogFile('erp.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/monitoring
 * @desc    Liefert Monitoring-Logs
 * @access  Privat
 */
router.get('/monitoring', authenticateJWT, async (req, res, next) => {
  try {
    const result = await readLogFile('monitoring.log', req.query);
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      },
      data: result.logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/logs/list
 * @desc    Listet alle verfügbaren Log-Dateien
 * @access  Privat
 */
router.get('/list', authenticateJWT, async (req, res, next) => {
  try {
    const files = await fs.readdir(LOG_DIR);
    const logFiles = files.filter(file => file.endsWith('.log'));
    
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: logFiles
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 