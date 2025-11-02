const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// 🔧 Configurar Cloudinary desde variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// GET /api/products - Obtener todos
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

// GET /api/products/:id - Obtener uno por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Buscando producto:', req.params.id);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    console.log('✅ Producto encontrado:', product.nombre);
    res.json(product);
  } catch (err) {
    console.error('❌ Error al buscar producto:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products - Crear producto
router.post('/', async (req, res) => {
  try {
    console.log('📦 Datos recibidos en backend:', req.body);

    const newProduct = new Product({
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      precio: Number(req.body.precio),
      descripcion: req.body.descripcion,
      imagen: req.body.imageUrl || req.body.imagen || 'https://placehold.co/400x300',
      cilindrada: Number(req.body.cilindrada),
      velocidadMax: Number(req.body.velocidadMax),
      peso: Number(req.body.peso),
    });

    console.log('💾 Guardando producto:', newProduct);
    const saved = await newProduct.save();
    console.log('✅ Producto guardado exitosamente');
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ Error al crear producto:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    console.log('✏️ Actualizando producto:', req.params.id);
    console.log('📦 Datos recibidos:', req.body);

    const updateData = {
      nombre: req.body.nombre,
      categoria: req.body.categoria,
      precio: Number(req.body.precio),
      cilindrada: Number(req.body.cilindrada),
      velocidadMax: Number(req.body.velocidadMax),
      peso: Number(req.body.peso),
      descripcion: req.body.descripcion,
      imagen: req.body.imageUrl || req.body.imagen,
    };

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Producto no encontrado' });

    console.log('✅ Producto actualizado');
    res.json(updated);
  } catch (err) {
    console.error('❌ Error al actualizar:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id - Eliminar producto + imagen de Cloudinary
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Eliminando producto:', req.params.id);

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // ✅ Eliminar imagen de Cloudinary si existe
    if (product.imagen && product.imagen.includes('cloudinary')) {
      try {
        const url = product.imagen;

        // ✅ Limpiar transformaciones y versiones
        const cleanUrl = url.replace(/\/image\/upload\/[^/]+/, '/image/upload').replace(/\/v\d+/, '');

        // ✅ Extraer public_id con carpeta
        const match = cleanUrl.match(/\/image\/upload\/(.+?)\.[^.]+$/);
        const publicId = match ? match[1] : null;

        if (!publicId) throw new Error('No se pudo extraer el public_id');

        console.log('🔍 URL de imagen:', url);
        console.log('🔍 public_id extraído:', publicId);

        const result = await cloudinary.uploader.destroy(publicId);
        console.log('✅ Resultado de destroy:', result);
      } catch (err) {
        console.warn('⚠️ No se pudo eliminar imagen de Cloudinary (continuando):', err.message);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    console.log('✅ Producto eliminado');
    res.json({ message: 'Producto e imagen eliminados exitosamente' });
  } catch (err) {
    console.error('❌ Error al eliminar:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;