const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    photoURL: { type: String }
  },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const FAQSchema = new mongoose.Schema({
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    photoURL: { type: String }
  },
  question: { type: String, required: true },
  answers: [AnswerSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FAQ', FAQSchema);