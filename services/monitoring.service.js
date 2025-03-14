const winston = require('winston');
const os = require('os');
const mongoose = require('mongoose');

// Logger konfigurieren
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/monitoring.log' })
  ]
});

// In-Memory-Speicherung für Metriken
// In einer Produktionsumgebung würde man dies in einer Datenbank speichern
const metricsStore = {
  apiCalls: {
    total: 0,
    today: 0,
    successRate: 100,
    history: [],
    endpoints: {}
  },
  errors: {
    total: 0,
    today: 0,
    criticalCount: 0,
    history: [],
    byType: {},
    byEndpoint: {}
  },
  transformations: {
    total: 0,
    active: 0,
    usage: {},
    history: []
  },
  webhooks: {
    total: 0,
    active: 0,
    calls: [],
    successRate: 100,
    byEndpoint: {}
  },
  system: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    uptime: 0,
    history: {
      cpu: [],
      memory: [],
      disk: []
    }
  },
  recentApiCalls: []
};

// Initialisieren der historischen Daten für die letzten 7 Tage
function initializeHistoricalData() {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000; // Millisekunden in einem Tag
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * oneDay));
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD Format
    
    metricsStore.apiCalls.history.push({
      date: dateStr,
      count: Math.floor(Math.random() * 500) + 300 // Zufällige Werte zwischen 300-800
    });
    
    metricsStore.errors.history.push({
      date: dateStr,
      count: Math.floor(Math.random() * 20) + 5 // Zufällige Werte zwischen 5-25
    });
    
    metricsStore.transformations.history.push({
      date: dateStr,
      count: Math.floor(Math.random() * 30) + 10 // Zufällige Werte zwischen 10-40
    });
    
    metricsStore.webhooks.calls.push({
      date: dateStr,
      count: Math.floor(Math.random() * 50) + 20, // Zufällige Werte zwischen 20-70
      successful: Math.floor(Math.random() * 45) + 20 // Etwas weniger als count
    });
    
    metricsStore.system.history.cpu.push({
      date: dateStr,
      value: Math.floor(Math.random() * 40) + 20 // Zufällige Werte zwischen 20-60%
    });
    
    metricsStore.system.history.memory.push({
      date: dateStr,
      value: Math.floor(Math.random() * 30) + 30 // Zufällige Werte zwischen 30-60%
    });
    
    metricsStore.system.history.disk.push({
      date: dateStr,
      value: Math.floor(Math.random() * 20) + 20 // Zufällige Werte zwischen 20-40%
    });
  }
  
  // Berechne zusammenfassende Metriken
  metricsStore.apiCalls.total = metricsStore.apiCalls.history.reduce((sum, day) => sum + day.count, 0);
  metricsStore.errors.total = metricsStore.errors.history.reduce((sum, day) => sum + day.count, 0);
  metricsStore.apiCalls.today = metricsStore.apiCalls.history[6].count;
  metricsStore.errors.today = metricsStore.errors.history[6].count;
  metricsStore.apiCalls.successRate = 100 - ((metricsStore.errors.total / metricsStore.apiCalls.total) * 100).toFixed(1);
  
  // Demo-Endpunkte für API-Aufrufe
  const endpoints = ['/api/erp/customers', '/api/erp/products', '/api/erp/orders', '/api/webhooks/trigger'];
  endpoints.forEach(endpoint => {
    metricsStore.apiCalls.endpoints[endpoint] = Math.floor(Math.random() * 2000) + 1000;
    metricsStore.errors.byEndpoint[endpoint] = Math.floor(Math.random() * 50);
  });
  
  // Demo-Fehlertypen
  const errorTypes = ['ValidationError', 'AuthenticationError', 'DatabaseError', 'NetworkError', 'TimeoutError'];
  errorTypes.forEach(type => {
    metricsStore.errors.byType[type] = Math.floor(Math.random() * 30) + 5;
  });
  
  // Demo-Transformationen
  metricsStore.transformations.total = 24;
  metricsStore.transformations.active = 18;
  const transformationTypes = ['Kunden nach Shopify', 'Produkte nach WooCommerce', 'Bestellungen nach SelectLine', 'Lager nach Magento'];
  transformationTypes.forEach(type => {
    metricsStore.transformations.usage[type] = Math.floor(Math.random() * 500) + 100;
  });
  
  // Demo-Webhooks
  metricsStore.webhooks.total = 12;
  metricsStore.webhooks.active = 10;
  const webhookEndpoints = ['/webhooks/shopify', '/webhooks/woocommerce', '/webhooks/selectline', '/webhooks/custom'];
  webhookEndpoints.forEach(endpoint => {
    metricsStore.webhooks.byEndpoint[endpoint] = {
      calls: Math.floor(Math.random() * 300) + 100,
      successful: Math.floor(Math.random() * 280) + 100
    };
  });
  
  // Demo-Systemdaten
  updateSystemMetrics();
  
  // Demo-Aktuelle API-Aufrufe
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date(now.getTime() - (i * 60000)); // Jede Minute ein Eintrag
    metricsStore.recentApiCalls.push({
      timestamp,
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      status: Math.random() > 0.1 ? 200 : 400, // 10% Fehlerrate
      duration: Math.floor(Math.random() * 300) + 50 // 50-350ms
    });
  }
}

// Aktualisiert die aktuellen Systemmetriken
function updateSystemMetrics() {
  try {
    // CPU-Auslastung
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const cpuUsage = 100 - (totalIdle / totalTick * 100);
    metricsStore.system.cpuUsage = Math.round(cpuUsage);
    
    // Speicherauslastung
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    metricsStore.system.memoryUsage = Math.round(memUsage);
    
    // Disk-Nutzung (Schätzung - in einer realen Anwendung würden Sie df oder ähnliches verwenden)
    // Hier verwenden wir eine zufällige Zahl für Demo-Zwecke
    metricsStore.system.diskUsage = Math.floor(Math.random() * 30) + 20; // 20-50%
    
    // Uptime in Sekunden
    metricsStore.system.uptime = os.uptime();
    
    logger.debug('System metrics updated', { 
      cpu: metricsStore.system.cpuUsage,
      memory: metricsStore.system.memoryUsage,
      disk: metricsStore.system.diskUsage
    });
  } catch (error) {
    logger.error('Error updating system metrics', { error });
  }
}

// Aktualisiert die täglichen Metriken
function updateDailyMetrics() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Prüfen, ob heute bereits in der Historie ist
    const apiCallsToday = metricsStore.apiCalls.history.find(entry => entry.date === today);
    if (!apiCallsToday) {
      // Neuer Tag - füge einen neuen Eintrag hinzu und entferne den ältesten
      metricsStore.apiCalls.history.push({ date: today, count: 0 });
      metricsStore.apiCalls.history.shift();
      
      metricsStore.errors.history.push({ date: today, count: 0 });
      metricsStore.errors.history.shift();
      
      metricsStore.transformations.history.push({ date: today, count: 0 });
      metricsStore.transformations.history.shift();
      
      metricsStore.webhooks.calls.push({ date: today, count: 0, successful: 0 });
      metricsStore.webhooks.calls.shift();
      
      metricsStore.system.history.cpu.push({ date: today, value: metricsStore.system.cpuUsage });
      metricsStore.system.history.cpu.shift();
      
      metricsStore.system.history.memory.push({ date: today, value: metricsStore.system.memoryUsage });
      metricsStore.system.history.memory.shift();
      
      metricsStore.system.history.disk.push({ date: today, value: metricsStore.system.diskUsage });
      metricsStore.system.history.disk.shift();
    }
    
    // Setze die heutigen Zähler zurück
    metricsStore.apiCalls.today = 0;
    metricsStore.errors.today = 0;
    
    logger.info('Daily metrics reset');
  } catch (error) {
    logger.error('Error updating daily metrics', { error });
  }
}

// Verfolgt einen API-Aufruf
function trackApiCall(endpoint, status, duration) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isSuccess = status >= 200 && status < 400;
    
    // Gesamtzähler aktualisieren
    metricsStore.apiCalls.total++;
    metricsStore.apiCalls.today++;
    
    // Historie aktualisieren
    const todayHistory = metricsStore.apiCalls.history.find(entry => entry.date === today);
    if (todayHistory) {
      todayHistory.count++;
    }
    
    // Endpunktstatistiken aktualisieren
    if (!metricsStore.apiCalls.endpoints[endpoint]) {
      metricsStore.apiCalls.endpoints[endpoint] = 0;
    }
    metricsStore.apiCalls.endpoints[endpoint]++;
    
    // Bei Fehlern auch Fehlerstatistiken aktualisieren
    if (!isSuccess) {
      trackError(endpoint, status, 'APIError');
    }
    
    // Erfolgsrate aktualisieren
    metricsStore.apiCalls.successRate = 100 - ((metricsStore.errors.total / metricsStore.apiCalls.total) * 100).toFixed(1);
    
    // Aktuelle API-Aufrufe aktualisieren
    metricsStore.recentApiCalls.unshift({
      timestamp: new Date(),
      endpoint,
      status,
      duration
    });
    
    // Beschränke die Liste auf die letzten 100 Aufrufe
    if (metricsStore.recentApiCalls.length > 100) {
      metricsStore.recentApiCalls.pop();
    }
    
    logger.debug('API call tracked', { endpoint, status, duration, isSuccess });
  } catch (error) {
    logger.error('Error tracking API call', { error, endpoint, status });
  }
}

// Verfolgt einen Fehler
function trackError(endpoint, status, errorType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Gesamtzähler aktualisieren
    metricsStore.errors.total++;
    metricsStore.errors.today++;
    
    // Historie aktualisieren
    const todayHistory = metricsStore.errors.history.find(entry => entry.date === today);
    if (todayHistory) {
      todayHistory.count++;
    }
    
    // Fehlertyp-Statistiken aktualisieren
    if (!metricsStore.errors.byType[errorType]) {
      metricsStore.errors.byType[errorType] = 0;
    }
    metricsStore.errors.byType[errorType]++;
    
    // Endpunktstatistiken aktualisieren
    if (!metricsStore.errors.byEndpoint[endpoint]) {
      metricsStore.errors.byEndpoint[endpoint] = 0;
    }
    metricsStore.errors.byEndpoint[endpoint]++;
    
    // Kritische Fehler zählen (z.B. 5xx Fehler)
    if (status >= 500) {
      metricsStore.errors.criticalCount++;
    }
    
    logger.debug('Error tracked', { endpoint, status, errorType });
  } catch (error) {
    logger.error('Error tracking error event', { error, endpoint, status, errorType });
  }
}

// Verfolgt eine Transformation
function trackTransformation(transformationType, isSuccess) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Transformationsstatistiken aktualisieren
    if (!metricsStore.transformations.usage[transformationType]) {
      metricsStore.transformations.usage[transformationType] = 0;
    }
    metricsStore.transformations.usage[transformationType]++;
    
    // Historie aktualisieren
    const todayHistory = metricsStore.transformations.history.find(entry => entry.date === today);
    if (todayHistory) {
      todayHistory.count++;
    }
    
    // Bei Fehlern auch Fehlerstatistiken aktualisieren
    if (!isSuccess) {
      trackError('transformation', 500, 'TransformationError');
    }
    
    logger.debug('Transformation tracked', { transformationType, isSuccess });
  } catch (error) {
    logger.error('Error tracking transformation', { error, transformationType });
  }
}

// Verfolgt einen Webhook-Aufruf
function trackWebhook(endpoint, isSuccess) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Webhook-Statistiken aktualisieren
    if (!metricsStore.webhooks.byEndpoint[endpoint]) {
      metricsStore.webhooks.byEndpoint[endpoint] = {
        calls: 0,
        successful: 0
      };
    }
    metricsStore.webhooks.byEndpoint[endpoint].calls++;
    if (isSuccess) {
      metricsStore.webhooks.byEndpoint[endpoint].successful++;
    }
    
    // Historie aktualisieren
    const todayHistory = metricsStore.webhooks.calls.find(entry => entry.date === today);
    if (todayHistory) {
      todayHistory.count++;
      if (isSuccess) {
        todayHistory.successful++;
      }
    }
    
    // Erfolgsrate aktualisieren
    let totalCalls = 0;
    let totalSuccessful = 0;
    
    Object.values(metricsStore.webhooks.byEndpoint).forEach(stats => {
      totalCalls += stats.calls;
      totalSuccessful += stats.successful;
    });
    
    metricsStore.webhooks.successRate = totalCalls > 0 ? (totalSuccessful / totalCalls * 100).toFixed(1) : 100;
    
    // Bei Fehlern auch Fehlerstatistiken aktualisieren
    if (!isSuccess) {
      trackError('webhook', 500, 'WebhookError');
    }
    
    logger.debug('Webhook tracked', { endpoint, isSuccess });
  } catch (error) {
    logger.error('Error tracking webhook', { error, endpoint });
  }
}

// Initialisiere die Metriken
function initializeMonitoring() {
  try {
    // Initialisiere historische Daten
    initializeHistoricalData();
    
    // Starte regelmäßige Aktualisierungen
    setInterval(updateSystemMetrics, 60000); // Alle 60 Sekunden
    setInterval(updateDailyMetrics, 3600000); // Stündlich prüfen (in Produktion täglich)
    
    logger.info('Monitoring service initialized');
    return true;
  } catch (error) {
    logger.error('Error initializing monitoring service', { error });
    return false;
  }
}

// Exportiere Metriken für API-Endpunkte
function getDashboardStats() {
  return {
    apiCalls: {
      total: metricsStore.apiCalls.total,
      today: metricsStore.apiCalls.today,
      successRate: metricsStore.apiCalls.successRate,
      history: metricsStore.apiCalls.history
    },
    errors: {
      total: metricsStore.errors.total,
      today: metricsStore.errors.today,
      criticalCount: metricsStore.errors.criticalCount,
      history: metricsStore.errors.history
    },
    transformations: {
      total: metricsStore.transformations.total,
      active: metricsStore.transformations.active,
      mostUsed: Object.keys(metricsStore.transformations.usage).reduce((a, b) => 
        metricsStore.transformations.usage[a] > metricsStore.transformations.usage[b] ? a : b, '')
    },
    system: {
      cpuUsage: metricsStore.system.cpuUsage,
      memoryUsage: metricsStore.system.memoryUsage,
      diskUsage: metricsStore.system.diskUsage,
      uptime: metricsStore.system.uptime
    },
    recentApiCalls: metricsStore.recentApiCalls.slice(0, 5)
  };
}

function getDetailedStats(timeRange = '7d') {
  // Konvertiere den Zeitbereich in Tage
  let days = 7;
  switch (timeRange) {
    case '1d': days = 1; break;
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    default: days = 7;
  }
  
  // Für die Demo verwenden wir unsere 7-Tage-Historie
  // In einer echten Anwendung würden wir hier aus der Datenbank abfragen
  
  return {
    apiCalls: {
      total: metricsStore.apiCalls.total,
      history: metricsStore.apiCalls.history,
      byEndpoint: metricsStore.apiCalls.endpoints
    },
    errors: {
      total: metricsStore.errors.total,
      history: metricsStore.errors.history,
      byType: metricsStore.errors.byType,
      byEndpoint: metricsStore.errors.byEndpoint
    },
    transformations: {
      total: metricsStore.transformations.total,
      active: metricsStore.transformations.active,
      history: metricsStore.transformations.history,
      usage: metricsStore.transformations.usage
    },
    webhooks: {
      total: metricsStore.webhooks.total,
      active: metricsStore.webhooks.active,
      calls: metricsStore.webhooks.calls,
      successRate: metricsStore.webhooks.successRate,
      byEndpoint: metricsStore.webhooks.byEndpoint
    },
    system: {
      current: {
        cpuUsage: metricsStore.system.cpuUsage,
        memoryUsage: metricsStore.system.memoryUsage,
        diskUsage: metricsStore.system.diskUsage,
        uptime: metricsStore.system.uptime
      },
      history: {
        cpu: metricsStore.system.history.cpu,
        memory: metricsStore.system.history.memory,
        disk: metricsStore.system.history.disk
      }
    }
  };
}

// API-Middleware zur Erfassung von API-Aufrufen
function apiMonitoringMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Erfasse Response nach Abschluss
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    const responseTime = Date.now() - startTime;
    trackApiCall(req.originalUrl, res.statusCode, responseTime);
  };
  
  next();
}

module.exports = {
  initializeMonitoring,
  apiMonitoringMiddleware,
  trackApiCall,
  trackError,
  trackTransformation,
  trackWebhook,
  getDashboardStats,
  getDetailedStats
}; 