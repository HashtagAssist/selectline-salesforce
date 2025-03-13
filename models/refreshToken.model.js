const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema für Refresh-Tokens
 */
const refreshTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdByIp: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  revokedByIp: {
    type: String
  }
}, {
  timestamps: true // createdAt und updatedAt automatisch hinzufügen
});

/**
 * Indizes für schnellere Abfragen
 */
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

/**
 * Virtuelle Eigenschaft, um zu prüfen, ob das Token widerrufen wurde
 */
refreshTokenSchema.virtual('isRevoked').get(function() {
  return !!this.revokedAt;
});

/**
 * Virtuelle Eigenschaft, um zu prüfen, ob das Token abgelaufen ist
 */
refreshTokenSchema.virtual('isExpired').get(function() {
  return Date.now() >= this.expiresAt.getTime();
});

/**
 * Virtuelle Eigenschaft, um zu prüfen, ob das Token aktiv ist
 */
refreshTokenSchema.virtual('isActive').get(function() {
  return !this.isRevoked && !this.isExpired;
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken; 