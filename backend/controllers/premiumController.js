const db = require('../config/config');
const bcrypt = require('bcryptjs');

exports.purchasePremium = async (req, res) => {
  console.log('📥 Llegó a purchasePremium con body:', req.body);

  const { usuario_id, numeroTarjeta, nombreTitular, fechaExpiracion, cvv } = req.body;

  // Validaciones básicas
  if (!usuario_id || !numeroTarjeta || !nombreTitular || !fechaExpiracion || !cvv) {
    console.warn('⚠️ Faltan campos');
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  try {
    // Encripta el número y el CVV
    const hashedNumero = await bcrypt.hash(numeroTarjeta, 10);
    const hashedCvv = await bcrypt.hash(cvv, 10);

    // Verifica que el usuario exista (opcional pero útil)
    const userExists = await new Promise((resolve, reject) => {
      db.query('SELECT id FROM usuarios WHERE id = ?', [usuario_id], (err, results) => {
        if (err) return reject(err);
        resolve(results.length > 0);
      });
    });

    if (!userExists) {
      console.warn('⚠️ Usuario no encontrado:', usuario_id);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Inserta en la tabla correcta
    const sql = `
      INSERT INTO usuarios_tarjeta (usuario_id, numeroTarjeta, nombreTitular, fechaExpiracion, cvv, purchased)
      VALUES (?, ?, ?, ?, ?, 1)
    `;

    db.query(sql, [usuario_id, hashedNumero, nombreTitular, fechaExpiracion, hashedCvv], (err, result) => {
      if (err) {
        console.error('❌ Error en INSERT:', err);
        return res.status(500).json({ success: false, message: 'Error al guardar tarjeta' });
      }

      console.log('✅ Tarjeta guardada para usuario', usuario_id);
      res.json({ success: true, message: 'Compra exitosa. ¡Ahora eres premium!' });
    });
  } catch (error) {
    console.error('❌ Error en try/catch:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};

exports.hasPremium = (req, res) => {
  const userId = req.params.id;
  console.log('🔍 hasPremium para usuario:', userId);

  const sql = `SELECT purchased FROM usuarios_tarjeta WHERE usuario_id = ? ORDER BY id DESC LIMIT 1`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error en hasPremium:', err);
      return res.status(500).json({ success: false, message: 'Error al verificar premium' });
    }

    const hasPremium = results.length > 0 && results[0].purchased === 1;
    console.log('✅ hasPremium resultado:', hasPremium);
    res.json({ success: true, hasPremium });
  });
};

/*  NUEVO: ¿tiene tarjeta?  */
exports.hasCard = (req, res) => {
  const { userId } = req.params;

  const sql = `SELECT 1
               FROM usuarios_tarjeta
               WHERE usuario_id = ?
               LIMIT 1`;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Error en hasCard:', err);
      return res.status(500).json({ success: false, message: 'Error al verificar tarjeta' });
    }
    return res.json({ success: true, hasCard: rows.length > 0 });
  });
};