const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  general: {
    appName: { type: String, default: 'SFSL Sync' },
    defaultLanguage: { type: String, default: 'de' },
    timezone: { type: String, default: 'Europe/Berlin' },
    enableNotifications: { type: Boolean, default: true }
  },
  api: {
    baseUrl: { type: String, default: 'https://api.example.com' },
    timeout: { type: Number, default: 30000 },
    retryAttempts: { type: Number, default: 3 },
    maxConcurrentRequests: { type: Number, default: 10 }
  },
  email: {
    smtpServer: { type: String, default: 'smtp.example.com' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: 'user@example.com' },
    smtpPassword: { type: String, default: '' },
    senderEmail: { type: String, default: 'noreply@example.com' },
    enableEmailNotifications: { type: Boolean, default: true }
  },
  security: {
    sessionTimeout: { type: Number, default: 60 },
    requireMfa: { type: Boolean, default: false },
    allowedIPs: { type: String, default: '' },
    maxLoginAttempts: { type: Number, default: 5 }
  }
}, {
  timestamps: true
});

// Statische Methode zum Abrufen der Einstellungen
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Statische Methode zum Aktualisieren der Einstellungen
settingsSchema.statics.updateSettings = async function(newSettings) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(newSettings);
  } else {
    settings = await this.findOneAndUpdate(
      {},
      { $set: newSettings },
      { new: true, runValidators: true }
    );
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 