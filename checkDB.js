require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Conectado a MongoDB\n');

  // Ver productos
  const products = await Product.find();
  console.log('📦 PRODUCTOS EN LA BASE DE DATOS:');
  console.log(`Total: ${products.length}\n`);
  
  products.forEach((p, i) => {
    console.log(`--- Producto ${i + 1} ---`);
    console.log(`Nombre: ${p.nombre}`);
    console.log(`Precio: $${p.precio}`);
    console.log(`Categoría: ${p.categoria}`);
    console.log(`Imagen URL: ${p.imagen.substring(0, 80)}...`); // Solo primeros 80 chars
    console.log(`Imagen tipo: ${p.imagen.startsWith('http') ? '🌐 URL' : '📦 Base64'}`);
    console.log(`Tamaño imagen: ${p.imagen.length} caracteres\n`);
  });

  // Ver usuarios
  const users = await User.find().select('-password');
  console.log('👥 USUARIOS EN LA BASE DE DATOS:');
  console.log(`Total: ${users.length}\n`);
  
  users.forEach((u, i) => {
    console.log(`--- Usuario ${i + 1} ---`);
    console.log(`Nombre: ${u.name}`);
    console.log(`Email: ${u.email}`);
    console.log(`Rol: ${u.role}\n`);
  });

  process.exit();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});