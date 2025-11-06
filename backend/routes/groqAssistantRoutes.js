// groqAssistantRoutes.js
const axios = require('axios');
const express = require('express');
const router = express.Router();

const GROQ_KEY = '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';

const isHabitRelated = (question) => {
  const keywords = [
    'hábito', 'rutina', 'salud', 'ejercicio', 'dieta', 'sueño', 'agua', 'alimentación',
    'desayuno', 'cena', 'merienda', 'meditación', 'bienestar', 'productividad', 'ansiedad',
    'estrés', 'descanso', 'tiempo', 'organización', 'motivación', 'deporte', 'camina',
    'correr', 'gimnasio', 'fruta', 'verdura', 'azúcar', 'comida', 'comer', 'dormir',
    'despertar', 'mañana', 'noche', 'tarde', 'plan', 'meta', 'objetivo', 'constancia', 'tarea', 'crear', 
    'agregar', 'meta', 'objetivo', 'plan', 'recordatorio','hacer', 'seguir', 'cumplir', 'lista', 'pendiente', 'básquet', 'basket',
    'baloncesto', 'fútbol', 'correr', 'caminar','natación', 'gimnasio', 'pesas', 'yoga', 'pilates', 'ciclismo','deporte', 
   'entrenar', 'ejercitarse', 'cardio', 'flexiones'
  ];
  return keywords.some(kw => question.toLowerCase().includes(kw));
};

router.post('/groq/ask', async (req, res) => {
  try {
    
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Pregunta requerida' });

    if (!isHabitRelated(question)) {
      return res.json({
        success: true,
        answer: 'Solo puedo responder preguntas relacionadas con hábitos de vida saludables. ¿Te gustaría hablar de rutinas, sueño, alimentación o ejercicio?'
      });
    }

    const payload = {
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente especializado únicamente en hábitos de vida saludables. Solo responde preguntas relacionadas con rutinas, alimentación, ejercicio, sueño, bienestar y productividad personal. Si la pregunta no está relacionada, responde amablemente que no puedes ayudar con ese tema.'
        },
        { role: 'user', content: question }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 400
    };

    const reply = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
    });

    const answer = reply.data.choices[0].message.content;
    res.json({ success: true, answer });
  } catch (e) {
    console.error('Groq error:', e.response?.data || e.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});
router.post('/tasks/create', async (req, res) => {
  const { userId, titulo, descripcion, fecha, hora } = req.body;

  if (!userId || !titulo || !fecha) {
    return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
  }

  const query = `
    INSERT INTO usuario_tareas (usuario_id, titulo, descripcion, fechaProgramada, horaProgramada, completada)
    VALUES (?, ?, ?, ?, ?, 0)
  `;

  db.query(query, [userId, titulo, descripcion, fecha, hora || '00:00:00'], (err, result) => {
    if (err) {
      console.error('Error al crear tarea:', err);
      return res.status(500).json({ success: false, message: 'Error al crear tarea' });
    }

    res.json({ success: true, message: 'Tarea creada exitosamente', taskId: result.insertId });
  });
});
module.exports = (app) => { app.use('/api', router); };
