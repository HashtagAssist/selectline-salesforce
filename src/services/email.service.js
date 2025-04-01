const nodemailer = require('nodemailer');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Logger konfigurieren
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

// Transporter basierend auf Umgebung erstellen
let transporter;

// E-Mail-Verzeichnis für Entwicklung
const DEV_EMAILS_DIR = path.join(__dirname, '../dev-emails');

/**
 * Initialisiert den Transporter je nach Umgebung
 */
const initializeTransporter = async () => {
  try {
    // Nur in Produktion echte E-Mails senden
    if (process.env.NODE_ENV === 'production') {
      logger.info('Initialisiere Produktions-E-Mail-Transporter');
      
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      logger.info('Produktions-E-Mail-Transporter initialisiert');
    } else {
      // Im Entwicklungsmodus einen Mock-Transporter erstellen
      logger.info('Initialisiere Mock-Transporter für Entwicklungsmodus');
      
      // Verzeichnis für E-Mails erstellen, falls es nicht existiert
      if (!fs.existsSync(DEV_EMAILS_DIR)) {
        fs.mkdirSync(DEV_EMAILS_DIR, { recursive: true });
        logger.info(`Verzeichnis für Entwicklungs-E-Mails erstellt: ${DEV_EMAILS_DIR}`);
      }
      
      // Einfachen Mock-Transporter erstellen
      transporter = {
        sendMail: (mailOptions) => {
          return new Promise((resolve) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const subject = mailOptions.subject.replace(/[^a-zA-Z0-9-_]/g, '_');
            const filename = `${timestamp}_${mailOptions.to}_${subject}.html`;
            const filepath = path.join(DEV_EMAILS_DIR, filename);
            
            // HTML-Inhalt in Datei speichern
            let content = `
              <h1>Dev-Mode E-Mail</h1>
              <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 20px;">
                <p><strong>Von:</strong> ${mailOptions.from}</p>
                <p><strong>An:</strong> ${mailOptions.to}</p>
                <p><strong>Betreff:</strong> ${mailOptions.subject}</p>
                <p><strong>Datum:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <h2>Text-Version:</h2>
              <pre style="background: #f5f5f5; padding: 10px; white-space: pre-wrap;">${mailOptions.text || '(Keine Text-Version)'}</pre>
              
              <h2>HTML-Version:</h2>
              <div style="border: 1px solid #ddd; padding: 10px;">
                ${mailOptions.html || '(Keine HTML-Version)'}
              </div>
            `;
            
            fs.writeFileSync(filepath, content);
            
            // Auch in der Konsole anzeigen
            console.log('\n');
            console.log('================ DEV MODE EMAIL ================');
            console.log(`Von: ${mailOptions.from}`);
            console.log(`An: ${mailOptions.to}`);
            console.log(`Betreff: ${mailOptions.subject}`);
            console.log(`Gespeichert unter: ${filepath}`);
            console.log('===============================================\n');
            
            logger.info('Entwicklungsmodus: E-Mail als Datei gespeichert', { 
              to: mailOptions.to, 
              subject: mailOptions.subject,
              filepath
            });
            
            resolve({
              messageId: `dev-${timestamp}`,
              envelope: { from: mailOptions.from, to: [mailOptions.to] },
              response: `DEV MODE: E-Mail gespeichert unter ${filepath}`
            });
          });
        }
      };
      
      logger.info('Mock-Transporter für Entwicklungsmodus initialisiert');
    }
  } catch (error) {
    logger.error('Fehler beim Initialisieren des E-Mail-Transporters:', error);
    throw error;
  }
};

/**
 * E-Mail senden
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    if (!transporter) {
      logger.warn('Transporter nicht initialisiert. Initialisierung wird versucht...');
      await initializeTransporter();
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"API-System" <noreply@example.com>',
      to,
      subject,
      text,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('E-Mail erfolgreich gesendet/gespeichert', {
      messageId: info.messageId,
      to
    });
    
    return info;
  } catch (error) {
    logger.error('Fehler beim Senden der E-Mail:', {
      error: error.message,
      to,
      subject
    });
    throw error;
  }
};

/**
 * Verifizierungs-E-Mail senden
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email/${verificationToken}`;
  
  const subject = 'Bitte bestätigen Sie Ihre E-Mail-Adresse';
  
  // Text-Version
  const text = `Hallo ${user.firstName || user.username},\n\n` +
    `Vielen Dank für Ihre Registrierung. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf folgenden Link klicken:\n\n` +
    `${verificationUrl}\n\n` +
    `Dieser Link ist 24 Stunden gültig.\n\n` +
    `Falls Sie sich nicht registriert haben, ignorieren Sie bitte diese E-Mail.\n\n` +
    `Mit freundlichen Grüßen,\n` +
    `Ihr API-Team`;
  
  // HTML-Version
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
    <p>Mit freundlichen Grüßen,<br>Ihr API-Team</p>
  </div>`;
  
  return sendEmail(user.email, subject, html, text);
};

/**
 * Passwort-Reset-E-Mail senden
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/api/auth/password-reset/${resetToken}`;
  
  const subject = 'Passwort zurücksetzen';
  
  // Text-Version
  const text = `Hallo ${user.firstName || user.username},\n\n` +
    `Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Bitte klicken Sie auf folgenden Link, um Ihr Passwort zurückzusetzen:\n\n` +
    `${resetUrl}\n\n` +
    `Dieser Link ist 1 Stunde gültig.\n\n` +
    `Falls Sie keine Anfrage zum Zurücksetzen Ihres Passworts gestellt haben, ignorieren Sie bitte diese E-Mail.\n\n` +
    `Mit freundlichen Grüßen,\n` +
    `Ihr API-Team`;
  
  // HTML-Version
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
    <p>Mit freundlichen Grüßen,<br>Ihr API-Team</p>
  </div>`;
  
  return sendEmail(user.email, subject, html, text);
};

module.exports = {
  initializeTransporter,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
}; 