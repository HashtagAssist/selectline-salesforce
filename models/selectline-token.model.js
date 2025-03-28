const mongoose = require('mongoose');

const selectLineTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Token läuft nach 1 Stunde ab
  }
});

module.exports = mongoose.model('SelectLineToken', selectLineTokenSchema); 