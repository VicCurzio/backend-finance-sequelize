const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ventaRoutes = require('./routes/ventaRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const ventaController = require('./controllers/ventaController');
const authMiddleware = require('./middlewares/auth');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// 1. Middlewares de configuración
app.use(cors());
app.use(express.json());

// 2. TUS RUTAS (Deben ir aquí para que Express las encuentre)
app.get('/dashboard/line-chart', authMiddleware, ventaController.getLineChartData);
app.post('/import-json', authMiddleware, ventaController.importJson);
app.use('/ventas', ventaRoutes);
app.use('/gastos', gastoRoutes);

// 3. Middlewares de error (SIEMPRE AL FINAL)
app.use(notFoundHandler); // Si no entró en ninguna ruta de arriba, cae aquí
app.use(errorHandler);    // Si alguna ruta de arriba falló, cae aquí

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Microservicio de Finanzas corriendo en el puerto ${PORT}`);
});