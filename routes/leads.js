const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// GET - Obtener todos los leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error('❌ Error obteniendo leads:', error);
    res.status(500).json({ message: 'Error al obtener leads', error: error.message });
  }
});

// POST - Crear un nuevo lead
router.post('/', async (req, res) => {
  try {
    console.log('📥 Datos recibidos:', req.body);
    
    const { nombre, email, telefono, vehiculo, mensaje } = req.body;
    
    // Validación detallada
    const errors = [];
    if (!nombre || nombre.trim() === '') errors.push('nombre es requerido');
    if (!telefono || telefono.trim() === '') errors.push('telefono es requerido');
    if (!vehiculo || vehiculo.trim() === '') errors.push('vehiculo es requerido');
    
    if (errors.length > 0) {
      console.error('❌ Validación fallida:', errors);
      return res.status(400).json({ 
        message: 'Faltan campos requeridos',
        errors: errors,
        received: req.body
      });
    }
    
    const newLead = new Lead({
      nombre: nombre.trim(),
      email: email ? email.trim() : '',
      telefono: telefono.trim(),
      vehiculo: vehiculo.trim(),
      mensaje: mensaje ? mensaje.trim() : ''
    });
    
    console.log('💾 Intentando guardar lead:', newLead);
    
    const savedLead = await newLead.save();
    
    console.log('✅ Lead guardado exitosamente:', savedLead._id);
    
    res.status(201).json(savedLead);
  } catch (error) {
    console.error('💥 Error creando lead:', error);
    console.error('Stack trace:', error.stack);
    
    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({ 
        message: 'Error de validación', 
        errors: validationErrors,
        received: req.body
      });
    }
    
    res.status(400).json({ 
      message: 'Error al crear lead', 
      error: error.message,
      type: error.name,
      received: req.body
    });
  }
});

// DELETE - Eliminar un lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }
    res.json({ message: 'Lead eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error eliminando lead:', error);
    res.status(500).json({ message: 'Error al eliminar lead', error: error.message });
  }
});

module.exports = router;