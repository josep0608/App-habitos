const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'jostela',
  database: 'data_base'
});

db.connect(function (err) {
  if (err) throw err;
  console.log('DATABASE CONNECTED!');
});

module.exports = db;