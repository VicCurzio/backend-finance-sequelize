const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ventaRoutes = require('./routes/ventaRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const ventaController = require('./controllers/ventaController');
const authMiddleware = require('./middlewares/auth');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/dashboard/line-chart', authMiddleware, ventaController.getLineChartData);
app.post('/import-json', authMiddleware, ventaController.importJson);
app.use('/ventas', ventaRoutes);
app.use('/gastos', gastoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Microservicio de Finanzas corriendo en el puerto ${PORT}`);
});