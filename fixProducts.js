require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Conectado a MongoDB');
  
  const db = mongoose.connection.db;
  const collection = db.collection('products');
  
  // Ver cuántos productos hay
  const count = await collection.countDocuments();
  console.log(`📦 Total de productos: ${count}`);
  
  // Ver los productos actuales
  const products = await collection.find({}).toArray();
  console.log('📋 Productos actuales:', JSON.stringify(products, null, 2));
  
  // Opción 1: Eliminar todos los productos (para empezar limpio)
  // await collection.deleteMany({});
  // console.log('🗑️ Todos los productos eliminados');
  
  // Opción 2: Migrar imageUrl a imagen
  if (count > 0) {
    await collection.updateMany(
      { imageUrl: { $exists: true } },
      { $rename: { 'imageUrl': 'imagen' } }
    );
    console.log('✅ Campo imageUrl renombrado a imagen');
  }
  
  process.exit();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});