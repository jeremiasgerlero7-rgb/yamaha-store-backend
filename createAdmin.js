require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

console.log('🔍 Verificando variables de entorno...');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Definida' : '❌ No definida');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI no está definida en .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB Atlas');
    
    const exists = await User.findOne({ email: 'jeremiasgerlero7@gmail.com' });
    
    if (!exists) {
      const hashed = bcrypt.hashSync('123456', 10);
      await User.create({ 
        email: 'jeremiasgerlero7@gmail.com', 
        password: hashed 
      });
      console.log('✅ Usuario admin creado exitosamente');
      console.log('📧 Email: jeremiasgerlero7@gmail.com');
      console.log('🔑 Password: 123456');
    } else {
      console.log('ℹ️  Usuario admin ya existe en la base de datos');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB Atlas:', err.message);
    process.exit(1);
  });