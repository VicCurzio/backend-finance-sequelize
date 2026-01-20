const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', gastoController.createGasto);
router.get('/', gastoController.getGastos);
router.put('/:id', gastoController.updateGasto);
router.delete('/:id', gastoController.deleteGasto);

module.exports = router;