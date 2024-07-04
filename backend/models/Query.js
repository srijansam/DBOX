// models/Query.js
const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Open',
  },
  solution: {
    type: String,
    default: '',
  },
});

const Query = mongoose.model('Query', querySchema);

module.exports = Query;