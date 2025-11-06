const taskController = require('../controllers/taskController');
const pdfController = require('../controllers/pdfController'); // lo creamos abajo

module.exports = (app) => {
  app.get('/api/tasks/user/:id', taskController.getTasksByUser);
  app.post('/api/tasks/create', taskController.createTask);
  app.put('/api/tasks/routine', taskController.updateRoutine);
  app.delete('/api/tasks/routine', taskController.deleteRoutine);
  app.put('/api/tasks/:id/complete', taskController.toggleComplete);
  app.get('/api/tasks/completed/:id', taskController.getCompletedTasks);
  app.get('/api/tasks/outdated/:id', taskController.getOutdatedTasks);
  app.post('/api/tasks/routine', taskController.createRoutineAndFutureTasks);
  app.post('/tasks/pdf', pdfController.generatePdf);
};