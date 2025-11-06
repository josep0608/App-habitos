const personalizationController = require('../controllers/personalizationController');

module.exports = (app) => {
  app.get('/api/personalization/next-question', personalizationController.getNextQuestion);
  app.post('/api/personalization/answer', personalizationController.submitAnswer);
};