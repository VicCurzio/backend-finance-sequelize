const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);

router.post('/', ventaController.createVenta);
router.get('/', ventaController.getVentas);
router.put('/:id', ventaController.updateVenta);
router.delete('/:id', ventaController.deleteVenta);

module.exports = router;