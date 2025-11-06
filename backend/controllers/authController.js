const db = require('../config/config');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Faltan email o contraseña' });
  }

  try {
    // Buscar usuario por email
    const sql = `SELECT id, nombre, email, fotoPerfil, password FROM usuarios WHERE email = ? LIMIT 1`;
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error('❌ Error en login:', err);
        return res.status(500).json({ success: false, message: 'Error interno' });
      }

      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      const user = results[0];

      // Verificar contraseña (compara hash)
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      // Devolver usuario sin la contraseña
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        message: 'Login exitoso',
        data: userWithoutPassword,
      });
    });
  } catch (error) {
    console.error('❌ Error en try/catch login:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};