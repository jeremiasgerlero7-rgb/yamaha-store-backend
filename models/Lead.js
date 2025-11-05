const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  vehiculo: {
    type: String,
    required: [true, 'El vehículo es requerido'],
    trim: true
  },
  vehiculoImagen: {
    type: String,
    required: false,
    default: ''
  },
  vehiculoPrecio: {
    type: Number,
    required: false,
    default: 0
  },
  vehiculoCilindrada: {
    type: Number,
    required: false,
    default: 0
  },
  mensaje: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);