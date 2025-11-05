const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// GET - Obtener todos los leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener leads', error: error.message });
  }
});

// POST - Crear un nuevo lead
router.post('/', async (req, res) => {
  try {
    const { nombre, email, telefono, vehiculo, mensaje } = req.body;
    
    // Validación básica
    if (!nombre || !telefono || !vehiculo) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos',
        required: ['nombre', 'telefono', 'vehiculo']
      });
    }
    
    const newLead = new Lead({
      nombre,
      email: email || '', // Email opcional
      telefono,
      vehiculo,
      mensaje: mensaje || ''
    });
    
    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(400).json({ 
      message: 'Error al crear lead', 
      error: error.message,
      details: error.errors // Mongoose validation errors
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
    res.status(500).json({ message: 'Error al eliminar lead', error: error.message });
  }
});

module.exports = router;