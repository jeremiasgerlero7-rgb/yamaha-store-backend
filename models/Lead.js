const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // ========== DATOS DEL CLIENTE (lo que ingresa el usuario) ==========
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  mensaje: {
    type: String,
    default: ''
  },
  
  // ========== OPCIONES ADICIONALES ==========
  parteDePago: {
    type: Boolean,
    default: false
  },
  financiacion: {
    type: Boolean,
    default: false
  },
  
  // ========== DATOS DEL VEHÍCULO (copia del producto) ==========
  vehiculo: {
    type: String,
    default: ''
  },
  vehiculoImagen: {
    type: String,
    default: ''
  },
  vehiculoPrecio: {
    type: Number,
    default: 0
  },
  vehiculoCilindrada: {
    type: Number,
    default: 0
  },
  vehiculoCategoria: {
    type: String,
    default: ''
  },
  vehiculoPeso: {
    type: Number,
    default: 0
  },
  vehiculoVelocidadMax: {
    type: Number,
    default: 0
  },
  vehiculoDescripcion: {
    type: String,
    default: ''
  },
  
  // ========== REFERENCIA Y ESTADO ==========
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'cancelado'],
    default: 'pendiente'
  }
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

module.exports = mongoose.model('Lead', leadSchema);