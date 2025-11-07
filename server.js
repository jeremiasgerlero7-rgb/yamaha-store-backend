require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yamahastore.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (opcional pero útil)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ Yamaha Store API funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      leads: '/api/leads',
      products: '/api/products',
      auth: '/api/auth',
      users: '/api/users',
      faq: '/api/faq'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'OK',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/leads', require('./routes/leads'));
app.use('/api/products', require('./routes/products'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users')); 
app.use('/api/faq', require('./routes/faq'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Error de validación',
      message: err.message,
      details: err.errors
    });
  }
  
  // Error de cast de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'ID inválido',
      message: 'El ID proporcionado no es válido'
    });
  }
  
  // Error de duplicado (clave única)
  if (err.code === 11000) {
    return res.status(409).json({ 
      error: 'Registro duplicado',
      message: 'Ya existe un registro con esos datos'
    });
  }
  
  // Error genérico
  res.status(err.status || 500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error' 
      : err.message 
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  });

// Manejo de eventos de MongoDB
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de MongoDB:', err);
});

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar conexión:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada por SIGTERM');
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar conexión:', err);
    process.exit(1);
  }
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: ${process.env.NODE_ENV === 'production' ? 'https://yamaha-store-backend.onrender.com' : `http://localhost:${PORT}`}`);
  console.log('=================================');
});

// Manejo de errores del servidor
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso`);
    process.exit(1);
  } else {
    console.error('❌ Error del servidor:', error);
    process.exit(1);
  }
});

module.exports = app;
