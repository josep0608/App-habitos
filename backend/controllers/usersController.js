const User = require('../models/user');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configuración de multer (igual que en register)
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

module.exports = {
  async register(req, res) {
    const { nombre, email, password } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      User.create(
        { nombre, email, password: hashedPassword, fotoPerfil: image },
        (err, data) => {
          if (err) {
            return res.status(501).json({
              success: false,
              message: 'Error al registrar el usuario',
              error: err
            });
          }
          return res.status(201).json({
            success: true,
            message: 'Usuario registrado',
            data: {
              id: data.id,
              nombre: data.nombre,
              email: data.email,
              fotoPerfil: data.fotoPerfil
            }
          });
        }
      );
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Error interno',
        error: err
      });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    User.findByEmail(email, async (err, user) => {
      if (err || !user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      return res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          fotoPerfil: user.fotoPerfil
        }
      });
    });
  },

  // ✅ NUEVA FUNCIÓN: actualizar perfil (con imagen opcional)
  updateProfile: [
    upload.single('fotoPerfil'),
    async (req, res) => {
      const { id, nombre, email, password } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Falta id de usuario' });
      }

      const fields = [];
      const values = [];

      if (nombre) {
        fields.push('nombre = ?');
        values.push(nombre);
      }
      if (email) {
        fields.push('email = ?');
        values.push(email);
      }
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        fields.push('password = ?');
        values.push(hashed);
      }
      if (req.file) {
        fields.push('fotoPerfil = ?');
        values.push(`/uploads/${req.file.filename}`);
      }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay cambios' });
      }

      values.push(id); // para el WHERE

      const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('❌ Error en updateProfile:', err);
          return res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
        }

        const newFoto = req.file ? `/uploads/${req.file.filename}` : undefined;
        res.json({
          success: true,
          message: 'Perfil actualizado',
          data: { fotoPerfil: newFoto },
        });
      });
    },
  ],
};