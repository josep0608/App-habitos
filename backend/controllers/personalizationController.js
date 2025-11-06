const db = require('../config/config');

const questions = [
  { questionId: 1, pregunta: '¿Cuántas horas duermes al día?', options: ['Menos de 6h', '6-8h', 'Más de 8h'] },
  { questionId: 2, pregunta: '¿Realizas actividad física regularmente?', options: ['Nunca', 'A veces', 'Siempre'] },
  { questionId: 3, pregunta: '¿Con qué frecuencia comes comida saludable?', options: ['Rara vez', 'A veces', 'Muy seguido'] },
  { questionId: 4, pregunta: '¿Cuánta agua consumes diariamente?', options: ['Menos de 1L', '1-2L', 'Más de 2L'] },
  { questionId: 5, pregunta: '¿Cuánto tiempo dedicas a la lectura diariamente?', options: ['Nada', 'Menos de 30 min', 'Más de 1h'] },
  { questionId: 6, pregunta: '¿Practicas técnicas de relajación o meditación?', options: ['Nunca', 'A veces', 'Frecuentemente'] },
  { questionId: 7, pregunta: '¿Cuánto tiempo dedicas a tus hobbies o actividades de ocio?', options: ['Casi nada', 'Algunos días', 'Todos los días'] }
];

// Obtener siguiente pregunta
const getNextQuestion = (req, res) => {
  const lastQuestionId = parseInt(req.query.lastQuestionId);

  if (lastQuestionId === 7) {
    console.log('>>> Usuario ya terminó, devolviendo data: null');
    return res.json({ success: true, data: null });
  }

  if (!lastQuestionId) {
    return res.json({ success: true, data: questions[0] });
  }

  const nextIndex = questions.findIndex(q => q.questionId === lastQuestionId) + 1;
  if (nextIndex < questions.length) {
    return res.json({ success: true, data: questions[nextIndex] });
  }

  return res.json({ success: true, data: null });
};

// Guardar respuesta (sin crear tareas)
const submitAnswer = (req, res) => {
  const { userId, questionId, selectedOption } = req.body;

  console.log(`Usuario ${userId} respondió la pregunta ${questionId} con: ${selectedOption}`);

  // 1. Verificar si ya respondió
  db.query(
    `SELECT id FROM usuario_respuestas WHERE usuario_id = ? AND pregunta_id = ?`,
    [userId, questionId],
    (err, rows) => {
      if (err) {
        console.error('Error al verificar respuesta:', err);
        return res.status(500).json({ success: false, message: 'Error interno' });
      }

      const yaRespondio = rows.length > 0;

      // 2. Guardar solo si no existe
      if (!yaRespondio) {
        db.query(
          `INSERT INTO usuario_respuestas (usuario_id, pregunta_id, respuesta)
           VALUES (?, ?, ?)`,
          [userId, questionId, selectedOption],
          (err) => {
            if (err) {
              console.error('Error al guardar respuesta:', err);
              return res.status(500).json({ success: false, message: 'Error al guardar' });
            }
            continuar();
          }
        );
      } else {
        continuar();
      }

      // 3. Continuar
      function continuar() {
        if (Number(questionId) === 7) {
          // ✅ Última pregunta: crear tareas personalizadas
          crearTareasPersonalizadas(userId, () => {
            return res.json({
              success: true,
              message: 'Personalización completa ✅',
              inspirational: true,
              data: {
                inspirationalMessage: '¡Felicidades! Tus tareas personalizadas han sido creadas. ¡Es hora de comenzar tu nuevo hábito! 🌱',
                backgroundKey: 'final',
                lastQuestionId: questionId
              }
            });
          });
        } else {
          return res.json({
            success: true,
            message: 'Respuesta guardada',
            inspirational: false
          });
        }
      }
    }
  );
};

// ✅ Función para crear tareas personalizadas
function crearTareasPersonalizadas(usuario_id, callback) {
  const query = `
    SELECT 
      tp.titulo,
      tp.descripcion,
      tp.horaProgramada,
      tp.id AS predefinida_id
    FROM usuario_respuestas ur
    JOIN opciones op ON op.pregunta_id = ur.pregunta_id AND op.opcion = ur.respuesta
    JOIN opciones_tareas ot ON ot.opcion_id = op.id
    JOIN tareas_predefinidas tp ON tp.id = ot.tarea_predefinida_id
    WHERE ur.usuario_id = ?
  `;

  db.query(query, [usuario_id], (err, tareas) => {
    if (err) {
      console.error('Error al obtener tareas predefinidas:', err);
      return callback();
    }

    const horarios = ['08:00:00', '14:00:00', '20:00:00'];
    const valores = [];

    tareas.forEach((tarea) => {
      horarios.forEach((hora, index) => {
        const tituloUnico = tarea.titulo;
        const fechaUnica = new Date(new Date().setDate(new Date().getDate() + ((tarea.predefinida_id + usuario_id + index) % 7)));

        valores.push([
          usuario_id,
          tituloUnico,
          tarea.descripcion,
          fechaUnica,
          hora,
          null // ✅ No vinculamos a predefinida_id para evitar duplicados
        ]);
      });
    });

    const insertQuery = `
      INSERT INTO usuario_tareas (usuario_id, titulo, descripcion, fechaProgramada, horaProgramada, predefinida_id)
      VALUES ?
    `;

    db.query(insertQuery, [valores], (err, result) => {
      if (err) {
        console.error('Error al insertar tareas:', err);
      } else {
        console.log(`✅ ${valores.length} tareas únicas creadas para usuario ${usuario_id}`);
      }
      callback();
    });
  });
}

module.exports = { getNextQuestion, submitAnswer };