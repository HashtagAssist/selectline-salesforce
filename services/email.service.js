const nodemailer = require('nodemailer');
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
    new winston.transports.File({ filename: 'logs/email-service.log' })
  ]
});

// Transporter basierend auf Umgebung erstellen
let transporter;

// Im Entwicklungsmodus Ethereal für Testmails verwenden
async function createDevTransporter() {
  // Ethereal-Konto generieren
  const testAccount = await nodemailer.createTestAccount();
  
  logger.info('Created Ethereal test account', {
    user: testAccount.user,
    pass: testAccount.pass,
    web: 'https://ethereal.email'
  });
  
  // Transporter mit Ethereal-Konto erstellen
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

// Transporter initialisieren
async function initializeTransporter() {
  if (process.env.NODE_ENV === 'production') {
    // Produktionsumgebung: Echten SMTP-Server verwenden
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    logger.info('Production email transporter initialized');
  } else {
    // Entwicklungsumgebung: Ethereal verwenden
    transporter = await createDevTransporter();
    logger.info('Development email transporter initialized');
  }
}

/**
 * E-Mail senden
 * @param {Object} options - E-Mail-Optionen
 * @param {string} options.to - Empfänger-E-Mail
 * @param {string} options.subject - Betreff
 * @param {string} options.text - Textversion des Inhalts
 * @param {string} options.html - HTML-Version des Inhalts
 * @returns {Promise<Object>} - Informationen zur gesendeten E-Mail
 */
async function sendEmail(options) {
  // Transporter initialisieren, falls noch nicht geschehen
  if (!transporter) {
    await initializeTransporter();
  }
  
  try {
    // E-Mail senden
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"SelectLine ERP API" <noreply@example.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Erfolg loggen
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });
    
    // In Entwicklungsumgebung URL zur Vorschau loggen
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Preview URL', {
        previewUrl: nodemailer.getTestMessageUrl(info),
        to: options.to
      });
      
      // Für einfacheren Zugriff in der Konsole ausgeben
      console.log('Email Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    logger.error('Error sending email', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    throw error;
  }
}

/**
 * Bestätigungs-E-Mail senden
 * @param {Object} user - Benutzerobjekt
 * @param {string} verificationToken - Verifikationstoken
 * @returns {Promise<Object>} - Informationen zur gesendeten E-Mail
 */
async function sendVerificationEmail(user, verificationToken) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Bitte bestätigen Sie Ihre E-Mail-Adresse',
    text: `Hallo ${user.firstName || user.username},\n\n` +
          `Vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf folgenden Link klicken:\n\n` +
          `${verificationUrl}\n\n` +
          `Dieser Link ist 24 Stunden gültig.\n\n` +
          `Falls Sie sich nicht registriert haben, ignorieren Sie bitte diese E-Mail.\n\n` +
          `Mit freundlichen Grüßen,\n` +
          `Ihr SelectLine ERP API Team`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>E-Mail-Bestätigung</h2>
            <p>Hallo ${user.firstName || user.username},</p>
            <p>Vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf folgenden Button klicken:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">E-Mail bestätigen</a>
            </p>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>Dieser Link ist 24 Stunden gültig.</p>
            <p>Falls Sie sich nicht registriert haben, ignorieren Sie bitte diese E-Mail.</p>
            <p>Mit freundlichen Grüßen,<br>Ihr SelectLine ERP API Team</p>
          </div>`
  });
}

/**
 * Passwort-Zurücksetzen-E-Mail senden
 * @param {Object} user - Benutzerobjekt
 * @param {string} resetToken - Token zum Zurücksetzen des Passworts
 * @returns {Promise<Object>} - Informationen zur gesendeten E-Mail
 */
async function sendPasswordResetEmail(user, resetToken) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/api/auth/password-reset/${resetToken}`;
  
  return sendEmail({
    to: user.email,
    subject: 'Passwort zurücksetzen',
    text: `Hallo ${user.firstName || user.username},\n\n` +
          `Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Bitte klicken Sie auf folgenden Link, um Ihr Passwort zurückzusetzen:\n\n` +
          `${resetUrl}\n\n` +
          `Dieser Link ist 1 Stunde gültig.\n\n` +
          `Falls Sie keine Anfrage zum Zurücksetzen Ihres Passworts gestellt haben, ignorieren Sie bitte diese E-Mail.\n\n` +
          `Mit freundlichen Grüßen,\n` +
          `Ihr SelectLine ERP API Team`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Passwort zurücksetzen</h2>
            <p>Hallo ${user.firstName || user.username},</p>
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Bitte klicken Sie auf folgenden Button, um Ihr Passwort zurückzusetzen:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Passwort zurücksetzen</a>
            </p>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Dieser Link ist 1 Stunde gültig.</p>
            <p>Falls Sie keine Anfrage zum Zurücksetzen Ihres Passworts gestellt haben, ignorieren Sie bitte diese E-Mail.</p>
            <p>Mit freundlichen Grüßen,<br>Ihr SelectLine ERP API Team</p>
          </div>`
  });
}

// Service-Funktionen exportieren
module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  initializeTransporter
}; 