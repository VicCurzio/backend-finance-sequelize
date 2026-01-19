const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const authMiddleware = require('../middlewares/auth');

// 1. Aplicar protección JWT a todas las rutas de ventas
router.use(authMiddleware);

// 2. Operaciones CRUD de Ventas
router.post('/', ventaController.createVenta);       // Crear
router.get('/', ventaController.getVentas);          // Listar con filtros (día, semana, mes, año)
router.put('/:id', ventaController.updateVenta);     // Actualizar
router.delete('/:id', ventaController.deleteVenta);  // Borrado lógico

module.exports = router;