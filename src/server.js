require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

// Logger konfigurieren
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Services importieren
const { connectRedis } = require('./services/redis.service');
const { connectMongoDB } = require('./services/db.service');
const emailService = require('./services/email.service');
const monitoringService = require('./services/monitoring.service');

// Routen importieren
const authRoutes = require('./routes/auth.routes');
const erpRoutes = require('./routes/erp.routes');
const transformationRoutes = require('./routes/transformation.routes');
const webhookRoutes = require('./routes/webhook.routes');
const statsRoutes = require('./routes/stats.routes');
const logsRoutes = require('./routes/logs.routes');
const settingsRoutes = require('./routes/settingsRoutes');

// Express App initialisieren
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "unpkg.com"],
      "img-src": ["'self'", "data:"]
    }
  }
})); // Sicherheits-Headers setzen mit Anpassungen für Swagger UI
app.use(cors()); // Cross-Origin Resource Sharing aktivieren
app.use(express.json()); // JSON-Body-Parser
app.use(express.urlencoded({ extended: true }));

// Monitoring-Middleware hinzufügen, um alle API-Aufrufe zu verfolgen
app.use(monitoringService.apiMonitoringMiddleware);

// Weiterleitungs-Middleware für veraltete API-Endpunkte
const { apiRedirectMiddleware } = require('./middlewares/redirects.middleware');
app.use('/api', apiRedirectMiddleware);

app.use(morgan('combined')); // HTTP-Request-Logging

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // max 100 Anfragen pro IP innerhalb des Zeitfensters
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please try again later.'
  }
});
app.use(limiter);

// Direkter Zugriff auf die swagger.yaml Datei
app.get('/api-docs-spec', (req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.setHeader('Cache-Control', 'no-cache');
  const swaggerYaml = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
  res.send(swaggerYaml);
});

// Swagger UI mit URL zur Spezifikation statt direktem Laden der Datei
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerUrl: '/api-docs-spec',
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "SelectLine ERP API Documentation",
  customfavIcon: "/assets/favicon.ico"
}));

// Routen registrieren
app.use('/api/auth', authRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/transform', transformationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/settings', settingsRoutes);

// 404-Handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: StatusCodes.NOT_FOUND,
    message: 'Resource not found'
  });
});

// Globaler Fehlerhandler
app.use((err, req, res, next) => {
  // Erfasse alle Anfrageinformationen für bessere Fehlerdiagnose
  const requestInfo = {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body ? (typeof req.body === 'object' ? JSON.stringify(req.body) : req.body) : null,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      // Sensible Daten wie Auth-Header werden ausgelassen
    },
    ip: req.ip
  };

  // Erweiterte Fehlerinformationen
  const errorInfo = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    // Wenn es ein Validierungsfehler ist, füge die Validierungsfehler hinzu
    validationErrors: err.errors ? err.errors : undefined,
    // Wenn der Fehler einen Code hat, füge ihn hinzu
    code: err.code,
    statusCode: err.statusCode
  };

  // Detailliertes Logging
  logger.error(`Error: ${err.name}: ${err.message}`, { 
    error: errorInfo,
    request: requestInfo
  });
  
  // Erfasse den Fehler auch im Monitoring-System
  monitoringService.trackError(req.path, err.statusCode || 500, err.name || 'ServerError');
  
  // Bestimme den HTTP-Statuscode
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  
  // Antwortdaten je nach Umgebung
  let responseData = {
    status: 'error',
    message: err.message || 'An internal server error occurred'
  };
  
  // In Entwicklungsumgebung mehr Details hinzufügen
  if (process.env.NODE_ENV !== 'production') {
    responseData.details = {
      name: err.name,
      // Bei Validierungsfehlern die Details hinzufügen
      validationErrors: err.errors,
      // Stack Trace nur in Dev-Umgebung
      stack: err.stack
    };
  }
  
  res.status(statusCode).json(responseData);
});

// Server starten
const startServer = async () => {
  try {
    // Verbindungen zu Datenbanken herstellen
    await connectRedis();
    await connectMongoDB();
    
    // E-Mail-Service initialisieren
    await emailService.initializeTransporter();
    
    // Monitoring-Service initialisieren
    monitoringService.initializeMonitoring();
    
    const server = app.listen(PORT, () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      const addresses = [];
      
      // Alle verfügbaren IP-Adressen sammeln
      Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        interfaces.forEach(iface => {
          // IPv4-Adressen filtern, die keine interne Loopback-Adresse sind
          if (iface.family === 'IPv4' && !iface.internal) {
            addresses.push(iface.address);
          }
        });
      });

      logger.info(`Server running on port ${PORT}`);
      logger.info(`Local access: http://localhost:${PORT}`);
      logger.info(`API documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`API specification: http://localhost:${PORT}/api-docs-spec`);
      
      if (addresses.length > 0) {
        logger.info('Network access via:');
        addresses.forEach(address => {
          logger.info(`http://${address}:${PORT}`);
        });
      }
    });
  } catch (error) {
    logger.error('Error starting the server:', error);
    process.exit(1);
  }
};

startServer(); 