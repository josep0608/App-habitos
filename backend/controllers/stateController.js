const db = require('../config/config');
const PDFDocument = require('pdfkit');

exports.getMonthlyState = (req, res) => {
  const userId = req.params.id;
  const { year, month } = req.query; // 2025, 10

  if (!year || !month) return res.status(400).json({ success: false, message: 'Faltan año o mes' });

  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

  const sql = `
    SELECT fechaProgramada AS date, completada AS completed
    FROM usuario_tareas
    WHERE usuario_id = ? AND fechaProgramada BETWEEN ? AND ?
    ORDER BY fechaProgramada
  `;

  db.query(sql, [userId, startDate, endDate], (err, rows) => {
    if (err) {
      console.error('❌ Error en getMonthlyState:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener estado' });
    }

    // Calcular racha actual (máxima seguidilla de días completados)
    let currentStreak = 0;
    let maxStreak = 0;
    let temp = 0;

    rows.forEach((row) => {
      if (row.completed) {
        temp++;
        maxStreak = Math.max(maxStreak, temp);
      } else {
        temp = 0;
      }
    });
    currentStreak = maxStreak;

    res.json({
      success: true,
      data: {
        dailyStatus: rows,
        currentStreak,
      },
    });
  });
};

exports.generatePdf = async (req, res) => {
  const { userId, startDate, endDate } = req.body;

  if (!userId || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  const sql = `
    SELECT titulo, descripcion, fechaProgramada, horaProgramada, completada
    FROM usuario_tareas
    WHERE usuario_id = ? AND fechaProgramada BETWEEN ? AND ?
    ORDER BY fechaProgramada, horaProgramada
  `;

  db.query(sql, [userId, startDate, endDate], (err, rows) => {
    if (err) {
      console.error('❌ Error al generar PDF:', err);
      return res.status(500).json({ success: false, message: 'Error al generar PDF' });
    }

    // Crear PDF
    const doc = new PDFDocument();
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks.pdf"');
      res.send(pdfData);
    });

    doc.fontSize(20).text('Reporte de Tareas', 100, 50);
    doc.fontSize(12).text(`Usuario ID: ${userId}`, 100, 100);
    doc.text(`Período: ${startDate} al ${endDate}`, 100, 120);

    let y = 150;
    rows.forEach((task) => {
      doc.text(`• ${task.titulo} - ${task.fechaProgramada} ${task.horaProgramada} - ${task.completada ? '✅' : '❌'}`, 100, y);
      y += 20;
    });

    doc.end();
  });
};

exports.askAssistant = async (req, res) => {
  const { question } = req.body;

  if (!question) return res.status(400).json({ success: false, message: 'Pregunta vacía' });

  // Respuesta mock (puedes conectar OpenAI después)
  const answer = `Gracias por preguntar: "${question}". Aquí podrías integrar OpenAI o cualquier servicio de IA.`;

  res.json({ success: true, answer });
};