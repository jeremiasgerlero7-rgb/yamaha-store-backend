const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, enum: ['moto', 'utv', 'atv'], required: true },
  precio: { type: Number, required: true },
  descripcion: { type: String, required: true },
  imagen: { type: String, default: true },
  cilindrada: { type: Number, default: '' },
  velocidadMax: { type: Number, default: '' },
  peso: { type: Number, default: '' },
  disponible: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);