const db   = require('../config/config');   // tu conexión actual
const PDFDocument = require('pdfkit');
const moment = require('moment');

exports.generatePdf = (req, res) => {
  const { userId, startDate, endDate } = req.body;
  if (!userId || !startDate || !endDate) {
    return res.status(400).json({ success: false, msg: 'Faltan parámetros' });
  }

  // 1. Query: tareas del rango
  const sql = `
    SELECT  titulo,
            descripcion,
            fechaProgramada,
            completada,
            CASE
              WHEN completada = 1 THEN 'CUMPLIDA'
              WHEN fechaProgramada < CURDATE() THEN 'ATRASADA'
              ELSE 'PENDIENTE'
            END AS estado
    FROM   usuario_tareas
    WHERE  usuario_id = ?
      AND  fechaProgramada BETWEEN ? AND ?
    ORDER BY
      estado DESC,
      fechaProgramada ASC
  `;

  db.query(sql, [userId, startDate, endDate], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, msg: 'Error en BD' });
    }

    // 2. Crear PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const filename = `reporte_${Date.now()}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Portada
    doc.fontSize(24).fillColor('#2A2E43').text('HabitFlow', 40, 40);
    doc.fontSize(14).fillColor('#555').text(`Reporte de tareas`, 40, 70);
    doc.moveDown();
    doc.fontSize(10).fillColor('#888').text(`Desde: ${moment(startDate).format('DD/MM/YYYY')}  Hasta: ${moment(endDate).format('DD/MM/YYYY')}`);
    doc.moveDown(2);

    // Agrupar
    const cumplidas = rows.filter(r => r.estado === 'CUMPLIDA');
    const atrasadas = rows.filter(r => r.estado === 'ATRASADA');

    // Sección CUMPLIDAS
    if (cumplidas.length) {
      doc.fontSize(12).fillColor('#4CAF50').text('✅ Tareas Cumplidas', { underline: true });
      doc.moveDown(0.5);
      cumplidas.forEach(t => {
        doc.fontSize(10).fillColor('#333').text(`• ${t.titulo}  (${moment(t.fechaProgramada).format('DD/MM')})`);
        if (t.descripcion) doc.fontSize(9).fillColor('#666').text(`   ${t.descripcion}`, { indent: 10 });
      });
      doc.moveDown();
    }

    // Sección ATRASADAS
    if (atrasadas.length) {
      doc.fontSize(12).fillColor('#F44336').text('❌ Tareas Atrasadas', { underline: true });
      doc.moveDown(0.5);
      atrasadas.forEach(t => {
        doc.fontSize(10).fillColor('#333').text(`• ${t.titulo}  (${moment(t.fechaProgramada).format('DD/MM')})`);
        if (t.descripcion) doc.fontSize(9).fillColor('#666').text(`   ${t.descripcion}`, { indent: 10 });
      });
      doc.moveDown();
    }

    // Si no hay nada
    if (!cumplidas.length && !atrasadas.length) {
      doc.fontSize(11).fillColor('#999').text('No hay tareas en el rango seleccionado.');
    }

    doc.end();
  });
};