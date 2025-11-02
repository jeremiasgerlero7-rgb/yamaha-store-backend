require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Conectado a MongoDB');
  
  const db = mongoose.connection.db;
  const collection = db.collection('products');
  
  // Ver productos actuales
  const products = await collection.find({}).toArray();
  console.log('📦 Productos actuales:', JSON.stringify(products, null, 2));
  
  // Migrar imageUrl a imagen
  const result = await collection.updateMany(
    { imageUrl: { $exists: true } },
    [
      {
        $set: {
          imagen: '$imageUrl'
        }
      },
      {
        $unset: 'imageUrl'
      }
    ]
  );
  
  console.log('✅ Productos actualizados:', result.modifiedCount);
  
  // Ver productos después del cambio
  const updatedProducts = await collection.find({}).toArray();
  console.log('📦 Productos actualizados:', JSON.stringify(updatedProducts, null, 2));
  
  process.exit();
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});