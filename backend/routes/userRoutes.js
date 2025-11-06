const usersController = require('../controllers/usersController');
const upload = require('../middlewares/upload');

module.exports = (app) => {
  app.post('/api/users/create', upload.single('image'), usersController.register);
  app.post('/api/users/login', usersController.login); // 👈 agregamos login
  app.post('/api/users/updateProfile', usersController.updateProfile);
};