const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },       
  type: { type: String },                      
  size: { type: Number },                     
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);