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

// MongoDB-Schemas und Modelle für Metriken

// Schema für API-Aufrufe
const ApiCallSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  endpoint: { type: String, required: false },
  status: { type: Number, required: false },
  duration: { type: Number, required: false },
  timestamp: { type: Date, default: Date.now }
});

// Schema für Fehler
const ErrorSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  endpoint: { type: String, required: false },
  status: { type: Number, required: false },
  errorType: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

// Schema für Transformationen
const TransformationSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  type: { type: String, required: false },
  isSuccess: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
});

// Schema für Webhook-Aufrufe
const WebhookSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  successful: { type: Number, default: 0 },
  endpoint: { type: String, required: false },
  isSuccess: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
});

// Schema für Systemmetriken
const SystemMetricsSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['cpu', 'memory', 'disk'] },
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Schema für Metrik-Konfiguration (aktive Transformationen, Webhooks, etc.)
const ConfigSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  active: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Mongoose-Modelle erstellen
const ApiCall = mongoose.model('ApiCall', ApiCallSchema);
const Error = mongoose.model('Error', ErrorSchema);
const Transformation = mongoose.model('Transformation', TransformationSchema);
const Webhook = mongoose.model('Webhook', WebhookSchema);
const SystemMetric = mongoose.model('SystemMetric', SystemMetricsSchema);
const Config = mongoose.model('Config', ConfigSchema);

// Temporärer Zwischenspeicher für aktuelle Werte
const currentMetrics = {
  apiCalls: { today: 0 },
  errors: { today: 0 },
  system: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    uptime: 0
  },
  recentApiCalls: []
};

// Initialisieren der historischen Daten für die letzten 7 Tage
async function initializeHistoricalData() {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000; // Millisekunden in einem Tag
  
  // Prüfen, ob bereits Daten vorhanden sind
  const existingApiCalls = await ApiCall.find({}).sort({date: -1}).limit(1);
  if (existingApiCalls.length > 0) {
    logger.info('Historische Daten bereits in der Datenbank vorhanden');
    return;
  }
  
  logger.info('Erstelle initiale historische Metriken für die letzten 7 Tage');
  
  const configPromises = [
    new Config({ type: 'transformations', count: 24, active: 18 }).save(),
    new Config({ type: 'webhooks', count: 12, active: 10 }).save()
  ];
  
  await Promise.all(configPromises);
  
  const bulkOps = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * oneDay));
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD Format
    
    // API-Aufrufe
    const apiCallCount = Math.floor(Math.random() * 500) + 300;
    bulkOps.push(new ApiCall({ 
      date: dateStr, 
      count: apiCallCount
    }));
    
    // Fehler
    const errorCount = Math.floor(Math.random() * 20) + 5;
    bulkOps.push(new Error({ 
      date: dateStr, 
      count: errorCount
    }));
    
    // Transformationen
    const transformationCount = Math.floor(Math.random() * 30) + 10;
    bulkOps.push(new Transformation({ 
      date: dateStr, 
      count: transformationCount
    }));
    
    // Webhooks
    const webhookCount = Math.floor(Math.random() * 50) + 20;
    const webhookSuccessful = Math.floor(Math.random() * 45) + 20;
    bulkOps.push(new Webhook({ 
      date: dateStr, 
      count: webhookCount,
      successful: webhookSuccessful
    }));
    
    // System-Metriken
    bulkOps.push(new SystemMetric({ 
      date: dateStr, 
      type: 'cpu', 
      value: Math.floor(Math.random() * 40) + 20
    }));
    
    bulkOps.push(new SystemMetric({ 
      date: dateStr, 
      type: 'memory', 
      value: Math.floor(Math.random() * 30) + 30
    }));
    
    bulkOps.push(new SystemMetric({ 
      date: dateStr, 
      type: 'disk', 
      value: Math.floor(Math.random() * 20) + 20
    }));
  }
  
  // Demo-Endpunkte für API-Aufrufe
  const endpoints = ['/api/erp/customers', '/api/erp/products', '/api/erp/orders', '/api/webhooks/trigger'];
  endpoints.forEach(endpoint => {
    bulkOps.push(new ApiCall({ 
      date: now.toISOString().split('T')[0],
      endpoint,
      count: Math.floor(Math.random() * 2000) + 1000
    }));
  });
  
  // Demo-Fehlertypen
  const errorTypes = ['ValidationError', 'AuthenticationError', 'DatabaseError', 'NetworkError', 'TimeoutError'];
  errorTypes.forEach(errorType => {
    bulkOps.push(new Error({ 
      date: now.toISOString().split('T')[0],
      errorType,
      count: Math.floor(Math.random() * 30) + 5
    }));
  });
  
  // Demo-Transformationen
  const transformationTypes = ['Kunden nach Shopify', 'Produkte nach WooCommerce', 'Bestellungen nach SelectLine', 'Lager nach Magento'];
  transformationTypes.forEach(type => {
    bulkOps.push(new Transformation({ 
      date: now.toISOString().split('T')[0],
      type,
      count: Math.floor(Math.random() * 500) + 100
    }));
  });
  
  // Demo-Webhooks
  const webhookEndpoints = ['/webhooks/shopify', '/webhooks/woocommerce', '/webhooks/selectline', '/webhooks/custom'];
  webhookEndpoints.forEach(endpoint => {
    const calls = Math.floor(Math.random() * 300) + 100;
    const successful = Math.floor(Math.random() * 280) + 100;
    bulkOps.push(new Webhook({ 
      date: now.toISOString().split('T')[0],
      endpoint,
      count: calls,
      successful
    }));
  });
  
  // Demo-Systemdaten
  await updateSystemMetrics();
  
  // Alle Dokumente in einem Bulk-Insert hinzufügen
  try {
    await Promise.all(bulkOps.map(doc => doc.save()));
    logger.info('Historische Daten erfolgreich initialisiert');
  } catch (error) {
    logger.error('Fehler beim Initialisieren historischer Daten', { error });
  }
}

// Aktualisiert die aktuellen Systemmetriken
async function updateSystemMetrics() {
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
    currentMetrics.system.cpuUsage = Math.round(cpuUsage);
    
    // Speicherauslastung
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;
    currentMetrics.system.memoryUsage = Math.round(memUsage);
    
    // Disk-Nutzung (Schätzung - in einer realen Anwendung würden Sie df oder ähnliches verwenden)
    // Hier verwenden wir eine zufällige Zahl für Demo-Zwecke
    currentMetrics.system.diskUsage = Math.floor(Math.random() * 30) + 20; // 20-50%
    
    // Uptime in Sekunden
    currentMetrics.system.uptime = os.uptime();
    
    // In der Datenbank speichern
    const today = new Date().toISOString().split('T')[0];
    
    const systemMetrics = [
      { type: 'cpu', value: currentMetrics.system.cpuUsage },
      { type: 'memory', value: currentMetrics.system.memoryUsage },
      { type: 'disk', value: currentMetrics.system.diskUsage }
    ];
    
    await Promise.all(systemMetrics.map(metric => 
      SystemMetric.updateOne(
        { date: today, type: metric.type },
        { $set: { value: metric.value } },
        { upsert: true }
      )
    ));
    
    logger.debug('System metrics updated', { 
      cpu: currentMetrics.system.cpuUsage,
      memory: currentMetrics.system.memoryUsage,
      disk: currentMetrics.system.diskUsage
    });
  } catch (error) {
    logger.error('Error updating system metrics', { error });
  }
}

// Aktualisiert die täglichen Metriken
async function updateDailyMetrics() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Prüfen, ob heute bereits in der Historie ist
    const apiCallsToday = await ApiCall.findOne({ date: today, endpoint: null });
    if (!apiCallsToday) {
      logger.info('Erstelle neuen Tag für Metriken: ' + today);
      
      // Neue Tageseinträge für verschiedene Metrik-Typen erstellen
      await ApiCall.create({ date: today, count: 0 });
      await Error.create({ date: today, count: 0 });
      await Transformation.create({ date: today, count: 0 });
      await Webhook.create({ date: today, count: 0, successful: 0 });
      
      // Neue System-Metriken
      await SystemMetric.create({ date: today, type: 'cpu', value: currentMetrics.system.cpuUsage });
      await SystemMetric.create({ date: today, type: 'memory', value: currentMetrics.system.memoryUsage });
      await SystemMetric.create({ date: today, type: 'disk', value: currentMetrics.system.diskUsage });
    }
    
    // Setze die heutigen Zähler zurück
    currentMetrics.apiCalls.today = 0;
    currentMetrics.errors.today = 0;
    
    logger.info('Daily metrics reset');
  } catch (error) {
    logger.error('Error updating daily metrics', { error });
  }
}

// Verfolgt einen API-Aufruf
async function trackApiCall(endpoint, status, duration) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isSuccess = status >= 200 && status < 400;
    const now = new Date();
    
    // Tagesgesamtzähler aktualisieren
    await ApiCall.updateOne(
      { date: today, endpoint: null },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Endpunktstatistiken aktualisieren
    await ApiCall.updateOne(
      { date: today, endpoint },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Neuen API-Aufruf speichern
    await ApiCall.create({
      date: today,
      endpoint,
      status,
      duration,
      timestamp: now
    });
    
    // Bei Fehlern auch Fehlerstatistiken aktualisieren
    if (!isSuccess) {
      await trackError(endpoint, status, 'APIError');
    }
    
    // Aktuellen Zähler erhöhen
    currentMetrics.apiCalls.today++;
    
    // Aktuelle API-Aufrufe aktualisieren
    currentMetrics.recentApiCalls.unshift({
      timestamp: now,
      endpoint,
      status,
      duration
    });
    
    // Beschränke die Liste auf die letzten 100 Aufrufe
    if (currentMetrics.recentApiCalls.length > 100) {
      currentMetrics.recentApiCalls.pop();
    }
    
    logger.debug('API call tracked', { endpoint, status, duration, isSuccess });
  } catch (error) {
    logger.error('Error tracking API call', { error, endpoint, status });
  }
}

// Verfolgt einen Fehler
async function trackError(endpoint, status, errorType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Tagesgesamtzähler aktualisieren
    await Error.updateOne(
      { date: today, endpoint: null, errorType: null },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Fehlertyp-Statistiken aktualisieren
    await Error.updateOne(
      { date: today, errorType, endpoint: null },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Endpunktstatistiken aktualisieren
    await Error.updateOne(
      { date: today, endpoint, errorType: null },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Neuen Fehler speichern
    await Error.create({
      date: today,
      endpoint,
      status,
      errorType,
      timestamp: new Date()
    });
    
    // Aktuellen Zähler erhöhen
    currentMetrics.errors.today++;
    
    // Kritische Fehler zählen (z.B. 5xx Fehler)
    if (status >= 500) {
      await Error.updateOne(
        { date: today, errorType: 'CriticalError' },
        { $inc: { count: 1 } },
        { upsert: true }
      );
    }
    
    logger.debug('Error tracked', { endpoint, status, errorType });
  } catch (error) {
    logger.error('Error tracking error event', { error, endpoint, status, errorType });
  }
}

// Verfolgt eine Transformation
async function trackTransformation(transformationType, isSuccess) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Tagesgesamtzähler aktualisieren
    await Transformation.updateOne(
      { date: today, type: null },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Transformationstyp-Statistiken aktualisieren
    await Transformation.updateOne(
      { date: today, type: transformationType },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    
    // Neue Transformation speichern
    await Transformation.create({
      date: today,
      type: transformationType,
      isSuccess,
      timestamp: new Date()
    });
    
    // Bei Fehlern auch Fehlerstatistiken aktualisieren
    if (!isSuccess) {
      await trackError('transformation', 500, 'TransformationError');
    }
    
    logger.debug('Transformation tracked', { transformationType, isSuccess });
  } catch (error) {
    logger.error('Error tracking transformation', { error, transformationType });
  }
}

// Verfolgt einen Webhook-Aufruf
async function trackWebhook(endpoint, isSuccess) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Tagesgesamtzähler aktualisieren
    await Webhook.updateOne(
      { date: today, endpoint: null },
      { $inc: { count: 1, successful: isSuccess ? 1 : 0 } },
      { upsert: true }
    );
    
    // Endpunktstatistiken aktualisieren
    await Webhook.updateOne(
      { date: today, endpoint },
      { $inc: { count: 1, successful: isSuccess ? 1 : 0 } },
      { upsert: true }
    );
    
    // Neuen Webhook-Aufruf speichern
    await Webhook.create({
      date: today,
      endpoint,
      isSuccess,
      timestamp: new Date()
    });
    
    // Bei Fehlern auch Fehlerstatistiken aktualisieren
    if (!isSuccess) {
      await trackError('webhook', 500, 'WebhookError');
    }
    
    logger.debug('Webhook tracked', { endpoint, isSuccess });
  } catch (error) {
    logger.error('Error tracking webhook', { error, endpoint });
  }
}

// Initialisiere die Metriken
async function initializeMonitoring() {
  try {
    // Initialisiere historische Daten
    await initializeHistoricalData();
    
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
async function getDashboardStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // API-Aufrufe abrufen
    const totalApiCalls = await ApiCall.aggregate([
      { $match: { endpoint: null } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    
    const apiCallsHistory = await ApiCall.find({ endpoint: null })
      .sort({ date: -1 })
      .limit(7)
      .select('date count')
      .lean();
    
    // Fehler abrufen
    const totalErrors = await Error.aggregate([
      { $match: { endpoint: null, errorType: null } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    
    const criticalErrors = await Error.aggregate([
      { $match: { errorType: 'CriticalError' } },
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    
    const errorsHistory = await Error.find({ endpoint: null, errorType: null })
      .sort({ date: -1 })
      .limit(7)
      .select('date count')
      .lean();
    
    // Transformationen abrufen
    const transformationsConfig = await Config.findOne({ type: 'transformations' }).lean();
    
    const mostUsedTransformation = await Transformation.aggregate([
      { $match: { type: { $ne: null } } },
      { $group: { _id: "$type", total: { $sum: "$count" } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    
    // Aktuelle API-Aufrufe
    const recentApiCalls = await ApiCall.find({ endpoint: { $ne: null }, status: { $ne: null } })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('timestamp endpoint status duration')
      .lean();
    
    // Erfolgsrate berechnen
    const totalCount = totalApiCalls.length > 0 ? totalApiCalls[0].total : 0;
    const totalErrorCount = totalErrors.length > 0 ? totalErrors[0].total : 0;
    const successRate = totalCount > 0 ? 100 - ((totalErrorCount / totalCount) * 100).toFixed(1) : 100;
    
    return {
      apiCalls: {
        total: totalCount,
        today: currentMetrics.apiCalls.today,
        successRate: successRate,
        history: apiCallsHistory.map(h => ({ date: h.date, count: h.count }))
      },
      errors: {
        total: totalErrorCount,
        today: currentMetrics.errors.today,
        criticalCount: criticalErrors.length > 0 ? criticalErrors[0].total : 0,
        history: errorsHistory.map(h => ({ date: h.date, count: h.count }))
      },
      transformations: {
        total: transformationsConfig ? transformationsConfig.count : 0,
        active: transformationsConfig ? transformationsConfig.active : 0,
        mostUsed: mostUsedTransformation.length > 0 ? mostUsedTransformation[0]._id : ''
      },
      system: {
        cpuUsage: currentMetrics.system.cpuUsage,
        memoryUsage: currentMetrics.system.memoryUsage,
        diskUsage: currentMetrics.system.diskUsage,
        uptime: currentMetrics.system.uptime
      },
      recentApiCalls: recentApiCalls.map(call => ({
        timestamp: call.timestamp,
        endpoint: call.endpoint,
        status: call.status,
        duration: call.duration
      }))
    };
  } catch (error) {
    logger.error('Error getting dashboard stats', { error });
    throw error;
  }
}

async function getDetailedStats(timeRange = '7d') {
  try {
    // Konvertiere den Zeitbereich in Tage
    let days = 7;
    switch (timeRange) {
      case '1d': days = 1; break;
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 7;
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // API-Aufrufe abrufen
    const apiCallsHistory = await ApiCall.find({ 
      endpoint: null,
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date count').lean();
    
    const apiCallsByEndpoint = await ApiCall.aggregate([
      { $match: { endpoint: { $ne: null }, date: { $gte: startDateStr } } },
      { $group: { _id: "$endpoint", total: { $sum: "$count" } } }
    ]);
    
    // Fehler abrufen
    const errorsHistory = await Error.find({ 
      endpoint: null,
      errorType: null,
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date count').lean();
    
    const errorsByType = await Error.aggregate([
      { $match: { errorType: { $ne: null }, date: { $gte: startDateStr } } },
      { $group: { _id: "$errorType", total: { $sum: "$count" } } }
    ]);
    
    const errorsByEndpoint = await Error.aggregate([
      { $match: { endpoint: { $ne: null }, date: { $gte: startDateStr } } },
      { $group: { _id: "$endpoint", total: { $sum: "$count" } } }
    ]);
    
    // Transformationen abrufen
    const transformationsConfig = await Config.findOne({ type: 'transformations' }).lean();
    
    const transformationsHistory = await Transformation.find({ 
      type: null,
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date count').lean();
    
    const transformationsUsage = await Transformation.aggregate([
      { $match: { type: { $ne: null }, date: { $gte: startDateStr } } },
      { $group: { _id: "$type", total: { $sum: "$count" } } }
    ]);
    
    // Webhooks abrufen
    const webhooksConfig = await Config.findOne({ type: 'webhooks' }).lean();
    
    const webhooksHistory = await Webhook.find({ 
      endpoint: null,
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date count successful').lean();
    
    const webhooksByEndpoint = await Webhook.aggregate([
      { $match: { endpoint: { $ne: null }, date: { $gte: startDateStr } } },
      { $group: { 
        _id: "$endpoint", 
        calls: { $sum: "$count" },
        successful: { $sum: "$successful" }
      } }
    ]);
    
    // Systemmetriken abrufen
    const cpuHistory = await SystemMetric.find({ 
      type: 'cpu',
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date value').lean();
    
    const memoryHistory = await SystemMetric.find({ 
      type: 'memory',
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date value').lean();
    
    const diskHistory = await SystemMetric.find({ 
      type: 'disk',
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).select('date value').lean();
    
    // Gesamtzahlen und Erfolgsraten berechnen
    const totalApiCalls = apiCallsHistory.reduce((sum, day) => sum + day.count, 0);
    const totalWebhookCalls = webhooksHistory.reduce((sum, day) => sum + day.count, 0);
    const totalWebhookSuccessful = webhooksHistory.reduce((sum, day) => sum + day.successful, 0);
    const webhookSuccessRate = totalWebhookCalls > 0 ? (totalWebhookSuccessful / totalWebhookCalls * 100).toFixed(1) : 100;
    
    return {
      apiCalls: {
        total: totalApiCalls,
        history: apiCallsHistory.map(h => ({ date: h.date, count: h.count })),
        byEndpoint: apiCallsByEndpoint.reduce((obj, item) => {
          obj[item._id] = item.total;
          return obj;
        }, {})
      },
      errors: {
        total: errorsHistory.reduce((sum, day) => sum + day.count, 0),
        history: errorsHistory.map(h => ({ date: h.date, count: h.count })),
        byType: errorsByType.reduce((obj, item) => {
          obj[item._id] = item.total;
          return obj;
        }, {}),
        byEndpoint: errorsByEndpoint.reduce((obj, item) => {
          obj[item._id] = item.total;
          return obj;
        }, {})
      },
      transformations: {
        total: transformationsConfig ? transformationsConfig.count : 0,
        active: transformationsConfig ? transformationsConfig.active : 0,
        history: transformationsHistory.map(h => ({ date: h.date, count: h.count })),
        usage: transformationsUsage.reduce((obj, item) => {
          obj[item._id] = item.total;
          return obj;
        }, {})
      },
      webhooks: {
        total: webhooksConfig ? webhooksConfig.count : 0,
        active: webhooksConfig ? webhooksConfig.active : 0,
        calls: webhooksHistory.map(h => ({ 
          date: h.date, 
          count: h.count, 
          successful: h.successful 
        })),
        successRate: webhookSuccessRate,
        byEndpoint: webhooksByEndpoint.reduce((obj, item) => {
          obj[item._id] = {
            calls: item.calls,
            successful: item.successful
          };
          return obj;
        }, {})
      },
      system: {
        current: {
          cpuUsage: currentMetrics.system.cpuUsage,
          memoryUsage: currentMetrics.system.memoryUsage,
          diskUsage: currentMetrics.system.diskUsage,
          uptime: currentMetrics.system.uptime
        },
        history: {
          cpu: cpuHistory.map(h => ({ date: h.date, value: h.value })),
          memory: memoryHistory.map(h => ({ date: h.date, value: h.value })),
          disk: diskHistory.map(h => ({ date: h.date, value: h.value }))
        }
      }
    };
  } catch (error) {
    logger.error('Error getting detailed stats', { error });
    throw error;
  }
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