const db = require('../config/config');
const bcrypt = require('bcryptjs');

const User = {};

User.create = (user, result) => {
  const sql = `
    INSERT INTO usuarios (nombre, email, password, authProvider, fechaCreacion, fotoPerfil)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [user.nombre, user.email, user.password, 'local', new Date(), user.fotoPerfil],
    (err, res) => {
      if (err) {
        console.log('Error al crear usuario:', err);
        return result(err, null);
      }
      console.log('Usuario creado con ID:', res.insertId);
      return result(null, { id: res.insertId, ...user });
    }
  );
};

User.findByEmail = (email, result) => {
  const sql = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(sql, [email], (err, res) => {
    if (err) return result(err, null);
    if (res.length === 0) return result(null, null);
    return result(null, res[0]);
  });
};

module.exports = User;