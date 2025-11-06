const premiumController = require('../controllers/premiumController');

module.exports = (app) => {
  // Compra (ya existente)
  app.post('/api/premium/purchase', premiumController.purchasePremium);

  // Verifica si es premium (ya existente)
  app.get('/api/premium/hasPremium/:id', premiumController.hasPremium);

  /*  NUEVO: ¿tiene tarjeta?  */
  app.get('/api/premium/hasCard/:userId', premiumController.hasCard);
};