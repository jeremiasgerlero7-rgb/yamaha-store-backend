const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Obteniendo productos...');
    const products = await Product.find();
    console.log(`✅ Productos encontrados: ${products.length}`);
    res.json(products);
  } catch (err) {
    console.error('❌ Error al obtener productos:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    console.log('📦 Datos recibidos:', req.body);

    const newProduct = new Product({
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      precio: Number(req.body.precio) || 0,
      descripcion: req.body.descripcion,
      imagen: req.body.imagen || 'https://placehold.co/400x300',
      cilindrada: Number(req.body.cilindrada) || 0,
      velocidadMax: Number(req.body.velocidadMax) || 0,
      peso: Number(req.body.peso) || 0,
      disponible: req.body.disponible !== undefined ? req.body.disponible : true,
      cantidad: Number(req.body.cantidad) || 0
    });

    const saved = await newProduct.save();
    console.log('✅ Producto guardado');
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      precio: Number(req.body.precio) || 0,
      cilindrada: Number(req.body.cilindrada) || 0,
      velocidadMax: Number(req.body.velocidadMax) || 0,
      peso: Number(req.body.peso) || 0,
      descripcion: req.body.descripcion,
      imagen: req.body.imagen,
      disponible: req.body.disponible !== undefined ? req.body.disponible : true,
      cantidad: Number(req.body.cantidad) || 0
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (product.imagen && product.imagen.includes('cloudinary')) {
      try {
        const cleanUrl = product.imagen.replace(/\/image\/upload\/[^/]+/, '/image/upload').replace(/\/v\d+/, '');
        const match = cleanUrl.match(/\/image\/upload\/(.+?)\.[^.]+$/);
        const publicId = match ? match[1] : null;

        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log('✅ Imagen eliminada de Cloudinary');
        }
      } catch (err) {
        console.warn('⚠️ No se pudo eliminar imagen:', err.message);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;