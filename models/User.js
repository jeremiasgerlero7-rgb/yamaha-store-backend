const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // No required (para usuarios de Google)
  role: { type: String, default: 'user' },  
  googleId: { type: String, sparse: true, unique: true }, // ID único de Google
  profilePicture: { type: String, default: null }, // URL de la foto de perfil
  cloudinaryPublicId: { type: String, default: null }, // ID de Cloudinary para eliminar imágenes
  provider: { type: String, default: 'local' }, // 'local' o 'google'
  hasCustomAvatar: { type: Boolean, default: false }, // Para saber si subió foto personalizada
}, {
  timestamps: true // Agrega createdAt y updatedAt
});

UserSchema.methods.comparePassword = function (password) {
  // Solo comparar si tiene password (usuarios locales)
  if (!this.password) return false;
  return bcrypt.compareSync(password, this.password);
};

// Método helper para obtener la foto de perfil correcta
UserSchema.methods.getProfilePicture = function() {
  // Si tiene foto personalizada subida (Cloudinary o avatar predefinido)
  if (this.hasCustomAvatar && this.profilePicture) {
    return this.profilePicture;
  }
  
  // Si es de Google y tiene foto
  if (this.provider === 'google' && this.profilePicture) {
    return this.profilePicture;
  }
  
  // Avatar por defecto con UI Avatars
  const initials = encodeURIComponent(this.name);
  return `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=200`;
};

// Virtual para saber si usó Google (por compatibilidad)
UserSchema.virtual('isGoogleAuth').get(function() {
  return this.provider === 'google';
});

// Asegurar que los virtuals se incluyan en JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);