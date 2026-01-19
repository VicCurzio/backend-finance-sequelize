const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', gastoController.createGasto);
router.get('/', gastoController.getGastos); // REQUISITO 1.6
router.put('/:id', gastoController.updateGasto); // REQUISITO 1.7
router.delete('/:id', gastoController.deleteGasto); // REQUISITO 1.8

module.exports = router;