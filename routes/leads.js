const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// ========== POST - Crear un nuevo lead ==========
router.post('/', async (req, res) => {
  try {
    console.log('📥 Datos recibidos para crear lead:', req.body);

    const newLead = new Lead({
      // Datos del cliente
      nombre: req.body.nombre,
      email: req.body.email || '',
      telefono: req.body.telefono,
      mensaje: req.body.mensaje || '',
      
      // Opciones
      parteDePago: req.body.parteDePago || false,
      financiacion: req.body.financiacion || false,
      
      // Datos del vehículo (copia del producto)
      vehiculo: req.body.vehiculo || '',
      vehiculoImagen: req.body.vehiculoImagen || '',
      vehiculoPrecio: req.body.vehiculoPrecio || 0,
      vehiculoCilindrada: req.body.vehiculoCilindrada || 0,
      vehiculoCategoria: req.body.vehiculoCategoria || '',
      vehiculoPeso: req.body.vehiculoPeso || 0,
      vehiculoVelocidadMax: req.body.vehiculoVelocidadMax || 0,
      vehiculoDescripcion: req.body.vehiculoDescripcion || '',
      
      // Referencia
      productId: req.body.productId || null,
      estado: 'pendiente'
    });

    const savedLead = await newLead.save();
    
    console.log('✅ Lead guardado exitosamente:', savedLead._id);
    
    res.status(201).json(savedLead);
  } catch (error) {
    console.error('❌ Error al crear lead:', error);
    res.status(400).json({ 
      message: 'Error al crear lead', 
      error: error.message
    });
  }
});

// ========== GET - Obtener todos los leads ==========
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    console.log(`📋 Se encontraron ${leads.length} leads`);
    res.json(leads);
  } catch (error) {
    console.error('❌ Error al obtener leads:', error);
    res.status(500).json({ message: 'Error al obtener leads', error: error.message });
  }
});

// ========== GET - Obtener un lead por ID ==========
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }
    res.json(lead);
  } catch (error) {
    console.error('❌ Error al obtener lead:', error);
    res.status(500).json({ message: 'Error al obtener lead', error: error.message });
  }
});

// ========== GET - Obtener estadísticas ==========
router.get('/stats/count', async (req, res) => {
  try {
    const pendientes = await Lead.countDocuments({ estado: 'pendiente' });
    const confirmados = await Lead.countDocuments({ estado: 'confirmado' });
    const cancelados = await Lead.countDocuments({ estado: 'cancelado' });
    
    const stats = {
      pendientes,
      confirmados,
      cancelados,
      total: pendientes + confirmados + cancelados
    };
    
    console.log('📊 Estadísticas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
});

// ========== PUT - Actualizar estado de un lead ==========
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!['pendiente', 'confirmado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }

    console.log(`✅ Lead ${lead._id} actualizado a estado: ${estado}`);
    res.json(lead);
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
});

// ========== DELETE - Eliminar un lead ==========
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead no encontrado' });
    }

    console.log(`🗑️ Lead ${lead._id} eliminado`);
    res.json({ message: 'Lead eliminado correctamente', lead });
  } catch (error) {
    console.error('❌ Error al eliminar lead:', error);
    res.status(500).json({ message: 'Error al eliminar lead', error: error.message });
  }
});

module.exports = router;