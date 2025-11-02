require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const User = require('../models/User');

// 🔧 CONFIGURACIÓN DE CLOUDINARY DESDE VARIABLES DE ENTORNO
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const JWT_SECRET = process.env.JWT_SECRET || 'mySuperSecretKey123!xº';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '629249247101-sjs0cd7em3mdndf3sb1v73adanjr2kfk.apps.googleusercontent.com';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// 🔧 Configurar multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// 🔐 Middleware de autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

// 🧹 LIMPIAR PUBLIC_ID CON CARPETAS (usar solo una vez)
router.post('/fix-cloudinary-ids', async (req, res) => {
  try {
    const users = await User.find({ cloudinaryPublicId: { $regex: '^profile_pictures/' } });
    for (const user of users) {
      const cleanId = user.cloudinaryPublicId.replace('profile_pictures/', '');
      user.cloudinaryPublicId = cleanId;
      await user.save();
      console.log('✅ Limpiado:', cleanId);
    }
    res.json({ message: '✅ Public IDs limpiados', count: users.length });
  } catch (err) {
    console.error('❌ Error al limpiar:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📸 SUBIR IMAGEN PERSONALIZADA A CLOUDINARY
router.post('/upload-profile-picture', authenticate, upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Iniciando subida a Cloudinary...');
    
    if (!req.file) {
      console.log('❌ No se recibió archivo');
      return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen' });
    }

    console.log('📦 Archivo recibido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Convertir buffer a base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Eliminar imagen anterior si existe (sin detener si falla)
    if (req.user.cloudinaryPublicId) {
      try {
        console.log('🗑️ Intentando eliminar imagen anterior:', req.user.cloudinaryPublicId);
        await cloudinary.uploader.destroy(req.user.cloudinaryPublicId);
        console.log('✅ Imagen anterior eliminada');
      } catch (error) {
        console.log('⚠️ No se pudo eliminar imagen anterior (continuando):', error.message);
      }
    }

    // Subir sin carpeta para evitar firma
    const publicId = `user_${req.user._id}_${Date.now()}`;
    console.log('⬆️ Subiendo a Cloudinary...');
    const result = await cloudinary.uploader.upload(dataURI, { public_id: publicId });

    console.log('✅ Subida exitosa:', {
      url: result.secure_url,
      public_id: result.public_id
    });

    // Actualizar usuario
    req.user.profilePicture = result.secure_url;
    req.user.cloudinaryPublicId = result.public_id;
    req.user.hasCustomAvatar = true;
    await req.user.save();

    console.log('✅ Usuario actualizado en DB');

    res.json({ 
      success: true, 
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('❌ Error completo en upload:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al subir la imagen'
    });
  }
});

// 🎨 ACTUALIZAR CON AVATAR PREDEFINIDO (sin subir a Cloudinary)
router.put('/update-avatar', authenticate, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ success: false, error: 'No se recibió URL del avatar' });
    }

    console.log('🎨 Actualizando con avatar predefinido:', avatarUrl);

    // Si tenía imagen en Cloudinary, intentar eliminarla (sin detener si falla)
    if (req.user.cloudinaryPublicId) {
      try {
        console.log('🗑️ Intentando eliminar imagen de Cloudinary:', req.user.cloudinaryPublicId);
        await cloudinary.uploader.destroy(req.user.cloudinaryPublicId);
        console.log('✅ Imagen de Cloudinary eliminada');
      } catch (error) {
        console.log('⚠️ No se pudo eliminar imagen de Cloudinary (continuando):', error.message);
      }
      req.user.cloudinaryPublicId = null;
    }

    // Actualizar con avatar predefinido
    req.user.profilePicture = avatarUrl;
    req.user.hasCustomAvatar = true;
    await req.user.save();

    console.log('✅ Avatar predefinido guardado');

    res.json({ 
      success: true, 
      url: avatarUrl,
      message: 'Avatar actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error al actualizar avatar:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error al actualizar avatar'
    });
  }
});

// 🔐 LOGIN TRADICIONAL
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    if (user.provider === 'google') {
      return res.status(400).json({ 
        message: 'Esta cuenta usa inicio de sesión con Google. Por favor, usa el botón de Google.' 
      });
    }

    const isValid = user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.getProfilePicture(),
        provider: user.provider,
        isGoogleAuth: user.isGoogleAuth,
        hasCustomAvatar: user.hasCustomAvatar,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ⭐ LOGIN/REGISTRO CON GOOGLE
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ 
        message: 'Solo se permiten cuentas de Gmail (@gmail.com)' 
      });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        profilePicture: picture,
        provider: 'google',
        role: 'user',
        hasCustomAvatar: false,
      });
      await user.save();
      isNewUser = true;
      console.log('✅ Nuevo usuario de Google creado:', email);
    } else if (user.provider === 'local') {
      user.googleId = googleId;
      user.profilePicture = picture;
      user.provider = 'google';
      user.hasCustomAvatar = false;
      await user.save();
      console.log('✅ Usuario local convertido a Google:', email);
    } else {
      if (!user.hasCustomAvatar) {
        user.profilePicture = picture;
        await user.save();
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.getProfilePicture(),
        provider: user.provider,
        isGoogleAuth: user.isGoogleAuth,
        hasCustomAvatar: user.hasCustomAvatar,
      },
      isNewUser,
    });
  } catch (err) {
    console.error('❌ Error en Google login:', err);
    res.status(401).json({ message: 'Token de Google inválido' });
  }
});

// 📝 REGISTRO TRADICIONAL
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ 
        message: 'Solo se permiten correos de Gmail (@gmail.com)' 
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      provider: 'local',
      role: 'user',
      profilePicture: null,
      hasCustomAvatar: false,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profilePicture: newUser.getProfilePicture(),
        provider: newUser.provider,
        isGoogleAuth: newUser.isGoogleAuth,
        hasCustomAvatar: newUser.hasCustomAvatar,
      },
      isNewUser: true,
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(400).json({ message: err.message });
  }
});

// 👤 Obtener usuario actual
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.getProfilePicture(),
        provider: user.provider,
        isGoogleAuth: user.isGoogleAuth,
        hasCustomAvatar: user.hasCustomAvatar,
      }
    });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

module.exports = router;