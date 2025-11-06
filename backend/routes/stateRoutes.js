const stateController = require('../controllers/stateController');

module.exports = (app) => {
  app.get('/api/stats/state/:id', stateController.getMonthlyState);
  app.post('/api/tasks/pdf', stateController.generatePdf);
  app.post('/api/assistant/ask', stateController.askAssistant);
};