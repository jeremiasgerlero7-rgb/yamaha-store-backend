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
  vehiculoImagen: { // ✅ CORREGIDO (antes era "Imagen")
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
  vehiculoCategoria: { // ✅ AGREGADO
    type: String,
    required: false,
    default: ''
  },
  vehiculoPeso: { // ✅ AGREGADO
    type: Number,
    required: false,
    default: 0
  },
  vehiculoVelocidadMax: { // ✅ AGREGADO
    type: Number,
    required: false,
    default: 0
  },
  vehiculoCantidad: { // ✅ AGREGADO (cantidad que quiere comprar)
    type: Number,
    required: false,
    default: 1
  },
  mensaje: {
    type: String,
    trim: true,
    default: ''
  },
  estado: { // ✅ NUEVO: para controlar el flujo de ventas
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada'],
    default: 'pendiente'
  },
  productId: { // ✅ NUEVO: referencia al producto original
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);