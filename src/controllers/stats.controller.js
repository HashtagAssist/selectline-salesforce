const { StatusCodes } = require('http-status-codes');
const monitoringService = require('../services/monitoring.service');

/**
 * Liefert detaillierte Statistiken zu API-Aufrufen
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getApiCallStats = async (req, res, next) => {
  try {
    // Detaillierte Statistiken aus dem Monitoring-Service abrufen
    const detailedStats = await monitoringService.getDetailedStats(req.query.timeRange);
    
    // Antwortzeiten aus dem Monitoring-Service abrufen
    const responseTimeStats = await monitoringService.getResponseTimeStats(req.query.timeRange);
    
    // Nur die API-Aufruf-Daten extrahieren
    const apiCallStats = {
      dailyCalls: {
        labels: detailedStats.apiCalls.history.map(entry => entry.date.substring(5)), // MM-DD Format
        data: detailedStats.apiCalls.history.map(entry => entry.count)
      },
      endpointDistribution: {
        labels: Object.keys(detailedStats.apiCalls.byEndpoint),
        data: Object.values(detailedStats.apiCalls.byEndpoint)
      },
      responseTime: responseTimeStats,
      errorRate: {
        overall: (detailedStats.errors.total / detailedStats.apiCalls.total * 100).toFixed(1),
        byEndpoint: Object.keys(detailedStats.errors.byEndpoint).reduce((acc, endpoint) => {
          acc[endpoint] = (detailedStats.errors.byEndpoint[endpoint] / 
            (detailedStats.apiCalls.byEndpoint[endpoint] || 1) * 100).toFixed(1);
          return acc;
        }, {})
      }
    };

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: apiCallStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Liefert Dashboard-Statistiken 
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Echte Daten aus dem Monitoring-Service abrufen
    const dashboardStats = await monitoringService.getDashboardStats();

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: dashboardStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Liefert Systemstatistiken 
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getSystemStats = async (req, res, next) => {
  try {
    // Detaillierte Statistiken aus dem Monitoring-Service abrufen
    const detailedStats = await monitoringService.getDetailedStats(req.query.timeRange);
    
    // Systemdaten extrahieren
    const systemStats = {
      cpu: {
        usage: detailedStats.system.current.cpuUsage,
        cores: require('os').cpus().length,
        history: detailedStats.system.history.cpu.map(entry => entry.value)
      },
      memory: {
        total: Math.round(require('os').totalmem() / (1024 * 1024)), // MB
        used: Math.round(require('os').totalmem() * (detailedStats.system.current.memoryUsage / 100) / (1024 * 1024)),
        free: Math.round(require('os').freemem() / (1024 * 1024)),
        usage: detailedStats.system.current.memoryUsage, // Prozent
        history: detailedStats.system.history.memory.map(entry => entry.value)
      },
      disk: {
        total: 500, // GB - in einer echten Anwendung würde man das vom Betriebssystem abfragen
        used: Math.round(500 * (detailedStats.system.current.diskUsage / 100)),
        free: Math.round(500 * (1 - detailedStats.system.current.diskUsage / 100)),
        usage: detailedStats.system.current.diskUsage, // Prozent
      },
      uptime: detailedStats.system.current.uptime,
      startTime: new Date(Date.now() - (detailedStats.system.current.uptime * 1000)).toISOString()
    };

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: systemStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Liefert Transformationsstatistiken 
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getTransformationStats = async (req, res, next) => {
  try {
    // Detaillierte Statistiken aus dem Monitoring-Service abrufen
    const detailedStats = await monitoringService.getDetailedStats(req.query.timeRange);
    
    // Transformationsdaten extrahieren und formatieren
    const transformationStats = {
      total: detailedStats.transformations.total,
      active: detailedStats.transformations.active,
      history: detailedStats.transformations.history,
      usage: {
        labels: Object.keys(detailedStats.transformations.usage),
        data: Object.values(detailedStats.transformations.usage)
      }
    };

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: transformationStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Liefert Webhook-Statistiken 
 * @param {Object} req - Express-Request-Objekt
 * @param {Object} res - Express-Response-Objekt
 * @param {Function} next - Express-Next-Funktion
 */
const getWebhookStats = async (req, res, next) => {
  try {
    // Detaillierte Statistiken aus dem Monitoring-Service abrufen
    const detailedStats = await monitoringService.getDetailedStats(req.query.timeRange);
    
    // Webhook-Daten extrahieren und formatieren
    const webhookStats = {
      total: detailedStats.webhooks.total,
      active: detailedStats.webhooks.active,
      successRate: detailedStats.webhooks.successRate,
      history: detailedStats.webhooks.calls.map(day => ({
        date: day.date,
        total: day.count,
        successful: day.successful,
        failed: day.count - day.successful
      })),
      endpoints: Object.keys(detailedStats.webhooks.byEndpoint).map(endpoint => ({
        name: endpoint,
        calls: detailedStats.webhooks.byEndpoint[endpoint].calls,
        successful: detailedStats.webhooks.byEndpoint[endpoint].successful,
        successRate: (detailedStats.webhooks.byEndpoint[endpoint].successful / 
          detailedStats.webhooks.byEndpoint[endpoint].calls * 100).toFixed(1)
      }))
    };

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: webhookStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApiCallStats,
  getDashboardStats,
  getSystemStats,
  getTransformationStats,
  getWebhookStats
}; 