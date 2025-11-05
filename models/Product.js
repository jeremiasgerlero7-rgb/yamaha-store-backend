const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, enum: ['moto', 'utv', 'atv'], required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String, required: true },
  imagen: { type: String, default: 'https://placehold.co/400x300' }, // ✅ CORREGIDO
  cilindrada: { type: Number, default: 0 }, // ✅ CORREGIDO ('' no es válido para Number)
  velocidadMax: { type: Number, default: 0 }, // ✅ CORREGIDO
  peso: { type: Number, default: 0 }, // ✅ CORREGIDO
  disponible: { type: Boolean, default: true },
  cantidad: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);