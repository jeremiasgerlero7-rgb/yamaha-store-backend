const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Middleware simple para verificar admin (opcional, puedes mejorarlo después)
const verifyAdmin = async (req, res, next) => {
  // Por ahora, lo dejamos sin protección. Luego puedes agregar verificación de token
  next();
};

// GET /api/users - Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Obteniendo usuarios...');
    const users = await User.find().select('-password'); // No enviar passwords
    console.log(`✅ Usuarios encontrados: ${users.length}`);
    res.json(users);
  } catch (err) {
    console.error('❌ Error al obtener usuarios:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/admin - Crear usuario admin
router.post('/admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('👤 Creando admin:', { name, email });

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Verificar si el email ya existe
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario con rol admin
    const newAdmin = new User({
      name,
      email,
      password: hashed,
      role: 'admin', // ← Rol admin
    });

    await newAdmin.save();
    console.log('✅ Admin creado exitosamente');

    // Devolver sin password
    const adminResponse = {
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
    };

    res.status(201).json(adminResponse);
  } catch (err) {
    console.error('❌ Error al crear admin:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/users/:id - Eliminar un usuario
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Eliminando usuario:', req.params.id);

    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario eliminado');
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('❌ Error al eliminar usuario:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/bulk - Eliminar múltiples usuarios
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    console.log('🗑️ Eliminando múltiples usuarios:', ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });

    console.log(`✅ ${result.deletedCount} usuarios eliminados`);
    res.json({ 
      message: `${result.deletedCount} usuarios eliminados exitosamente`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('❌ Error al eliminar usuarios:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;