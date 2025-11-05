const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  telefono: {
    type: String,
    required: true
  },
  vehiculo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);