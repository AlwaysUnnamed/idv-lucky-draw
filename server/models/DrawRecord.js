const mongoose = require('mongoose');

const drawRecordSchema = new mongoose.Schema({
  seq: { type: Number, default: Date.now },
  time: String,
  type: { type: String, enum: ['survivor', 'hunter'], required: true },
  player: String,
  character: String,
  talents: String,
  isLowProb: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DrawRecord', drawRecordSchema);
