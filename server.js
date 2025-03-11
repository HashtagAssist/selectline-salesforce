require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');

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

// Routen importieren
const authRoutes = require('./routes/auth.routes');
const erpRoutes = require('./routes/erp.routes');
const transformationRoutes = require('./routes/transformation.routes');
const webhookRoutes = require('./routes/webhook.routes');

// Express App initialisieren
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Sicherheits-Headers setzen
app.use(cors()); // Cross-Origin Resource Sharing aktivieren
app.use(express.json()); // JSON-Body-Parser
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // HTTP-Request-Logging

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // max 100 Anfragen pro IP innerhalb des Zeitfensters
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
  }
});
app.use(limiter);

// Routen registrieren
app.use('/api/auth', authRoutes);
app.use('/api/erp', erpRoutes);
app.use('/api/transform', transformationRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404-Handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: StatusCodes.NOT_FOUND,
    message: 'Ressource nicht gefunden'
  });
});

// Globaler Fehlerhandler
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method 
  });
  
  res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: err.message || 'Ein interner Serverfehler ist aufgetreten'
  });
});

// Server starten
const startServer = async () => {
  try {
    // Verbindungen zu Datenbanken herstellen
    await connectRedis();
    await connectMongoDB();
    
    app.listen(PORT, () => {
      logger.info(`Server läuft auf Port ${PORT}`);
    });
  } catch (error) {
    logger.error('Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
};

startServer(); 