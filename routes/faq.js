const express = require("express")
const router = express.Router()
const FAQ = require("../models/FAQ")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_super_seguro"

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" })
    }

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ message: "Token inválido" })
  }
}

// GET - Obtener todas las preguntas
router.get("/", async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 })
    res.json(faqs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST - Crear nueva pregunta (requiere autenticación)
router.post("/", authenticate, async (req, res) => {
  try {
    const { question } = req.body

    if (!question || question.trim() === "") {
      return res.status(400).json({ message: "La pregunta no puede estar vacía" })
    }

    const newFAQ = new FAQ({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        photoURL: req.user.photoURL,
      },
      question: question.trim(),
      answers: [],
    })

    await newFAQ.save()
    res.status(201).json(newFAQ)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// POST - Agregar respuesta a una pregunta (requiere autenticación)
router.post("/:id/answers", authenticate, async (req, res) => {
  try {
    const { text } = req.body
    const faq = await FAQ.findById(req.params.id)

    if (!faq) {
      return res.status(404).json({ message: "Pregunta no encontrada" })
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "La respuesta no puede estar vacía" })
    }

    const newAnswer = {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        photoURL: req.user.photoURL,
      },
      text: text.trim(),
      createdAt: new Date(),
    }

    faq.answers.push(newAnswer)
    await faq.save()

    res.status(201).json(faq)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PUT - Editar pregunta (solo el autor o admin)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { question } = req.body
    const faq = await FAQ.findById(req.params.id)

    if (!faq) {
      return res.status(404).json({ message: "Pregunta no encontrada" })
    }

    // Verificar permisos: solo el autor o admin pueden editar
    if (faq.user.id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "No tienes permisos para editar esta pregunta" })
    }

    if (!question || question.trim() === "") {
      return res.status(400).json({ message: "La pregunta no puede estar vacía" })
    }

    faq.question = question.trim()
    await faq.save()

    res.json(faq)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT - Editar respuesta (solo el autor de la respuesta o admin)
router.put("/:faqId/answers/:answerId", authenticate, async (req, res) => {
  try {
    const { faqId, answerId } = req.params
    const { text } = req.body
    const faq = await FAQ.findById(faqId)

    if (!faq) {
      return res.status(404).json({ message: "Pregunta no encontrada" })
    }

    // Buscar la respuesta
    const answer = faq.answers.find((answer) => answer._id.toString() === answerId)

    if (!answer) {
      return res.status(404).json({ message: "Respuesta no encontrada" })
    }

    // Verificar permisos: solo el autor de la respuesta o admin pueden editar
    if (answer.user.id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "No tienes permiso para editar esta respuesta" })
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "La respuesta no puede estar vacía" })
    }

    answer.text = text.trim()
    await faq.save()

    res.json(faq)
  } catch (err) {
    console.error("Error al editar respuesta:", err)
    res.status(500).json({ message: err.message })
  }
})

// DELETE - Eliminar pregunta (solo el autor o admin)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)

    if (!faq) {
      return res.status(404).json({ message: "Pregunta no encontrada" })
    }

    // Solo el autor o un admin pueden eliminar
    if (faq.user.id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "No tienes permisos para eliminar esta pregunta" })
    }

    await FAQ.findByIdAndDelete(req.params.id)
    res.json({ message: "Pregunta eliminada" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE - Eliminar respuesta específica (solo el autor de la respuesta o admin)
router.delete("/:faqId/answers/:answerId", authenticate, async (req, res) => {
  try {
    const { faqId, answerId } = req.params
    const faq = await FAQ.findById(faqId)

    if (!faq) {
      return res.status(404).json({ message: "Pregunta no encontrada" })
    }

    // Buscar la respuesta
    const answerIndex = faq.answers.findIndex((answer) => answer._id.toString() === answerId)

    if (answerIndex === -1) {
      return res.status(404).json({ message: "Respuesta no encontrada" })
    }

    const answer = faq.answers[answerIndex]

    // Verificar permisos: solo el autor de la respuesta o admin pueden eliminar
    if (answer.user.id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta respuesta" })
    }

    // Eliminar la respuesta
    faq.answers.splice(answerIndex, 1)
    await faq.save()

    res.json(faq)
  } catch (err) {
    console.error("Error al eliminar respuesta:", err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
