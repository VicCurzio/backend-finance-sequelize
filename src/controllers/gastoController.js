const { Gasto, Metrica, Venta } = require('../models');
const { Op } = require('sequelize');

// 1. POST /gastos – Crear gasto y actualizar métricas
exports.createGasto = async (req, res) => {
    try {
        const { fecha, categoria, monto, descripcion } = req.body;
        const usuario_id = req.user.id;

        const fechaNormalizada = fecha ? new Date(fecha + "T12:00:00") : new Date();

        const gasto = await Gasto.create({
            fecha: fechaNormalizada,
            categoria,
            monto,
            descripcion,
            usuario_id
        });

        // Actualización de KPIs en la tabla Metrica
        let [metrica] = await Metrica.findOrCreate({
            where: { usuario_id },
            defaults: { total_ventas: 0, total_gastos: 0, saldo: 0 }
        });

        metrica.total_gastos += parseFloat(monto);
        metrica.saldo = metrica.total_ventas - metrica.total_gastos;
        await metrica.save();

        res.status(201).json(gasto);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear gasto' });
    }
};

// 2. GET /gastos – Listar con Filtro de Calendario Natural
exports.getGastos = async (req, res) => {
    try {
        const { filtro, fechaSeleccionada } = req.query;
        const usuario_id = req.user.id;
        let where = { usuario_id };

        if (filtro && fechaSeleccionada) {
            let inicio, fin;

            switch (filtro) {
                case 'dia':
                    inicio = new Date(fechaSeleccionada + "T00:00:00");
                    fin = new Date(fechaSeleccionada + "T23:59:59");
                    break;
                case 'semana':
                    let ref = new Date(fechaSeleccionada + "T12:00:00");
                    let day = ref.getDay();
                    let diff = ref.getDate() - day + (day === 0 ? -6 : 1);
                    inicio = new Date(ref.setDate(diff));
                    inicio.setHours(0, 0, 0, 0);
                    fin = new Date(inicio);
                    fin.setDate(inicio.getDate() + 6);
                    fin.setHours(23, 59, 59, 999);
                    break;
                case 'mes':
                    // fechaSeleccionada llega como "YYYY-MM"
                    const [anioM, mesM] = fechaSeleccionada.split('-');
                    inicio = new Date(anioM, mesM - 1, 1, 0, 0, 0);
                    fin = new Date(anioM, mesM, 0, 23, 59, 59);
                    break;
                case 'año':
                    // fechaSeleccionada llega como "YYYY"
                    inicio = new Date(fechaSeleccionada, 0, 1, 0, 0, 0);
                    fin = new Date(fechaSeleccionada, 11, 31, 23, 59, 59);
                    break;
            }
            if (inicio && fin) where.fecha = { [Op.between]: [inicio, fin] };
        }

        const gastos = await Gasto.findAll({ where, order: [['fecha', 'DESC']] });
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener gastos' });
    }
};

// 3. PUT /gastos/:id – Actualizar y recalcular saldo
exports.updateGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, categoria, descripcion, fecha } = req.body;
        const usuario_id = req.user.id;

        const gasto = await Gasto.findOne({ where: { id, usuario_id } });
        if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

        if (monto !== undefined && parseFloat(monto) !== gasto.monto) {
            let metrica = await Metrica.findOne({ where: { usuario_id } });
            if (metrica) {
                metrica.total_gastos = metrica.total_gastos - gasto.monto + parseFloat(monto);
                metrica.saldo = metrica.total_ventas - metrica.total_gastos;
                await metrica.save();
            }
        }

        await gasto.update({
            monto,
            categoria,
            descripcion,
            fecha: fecha ? new Date(fecha + "T12:00:00") : gasto.fecha
        });
        res.json({ message: 'Gasto actualizado', data: gasto });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

// 4. DELETE /gastos/:id – Borrado lógico y ajuste de métricas
exports.deleteGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;
        const gasto = await Gasto.findOne({ where: { id, usuario_id } });

        if (!gasto) return res.status(404).json({ error: 'No existe' });

        let metrica = await Metrica.findOne({ where: { usuario_id } });
        if (metrica) {
            metrica.total_gastos -= gasto.monto;
            metrica.saldo = metrica.total_ventas - metrica.total_gastos;
            await metrica.save();
        }

        await gasto.destroy();
        res.json({ message: 'Gasto eliminado (soft delete)' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};

// 5. POST /import-json – Importación masiva con recálculo total
exports.importJson = async (req, res) => {
    try {
        const { datos } = req.body;
        const usuario_id = req.user.id;

        const datosConUsuario = datos.map(item => ({
            ...item,
            usuario_id,
            fecha: item.fecha ? new Date(item.fecha + "T12:00:00") : new Date()
        }));

        await Gasto.bulkCreate(datosConUsuario);

        const totalV = await Venta.sum('monto', { where: { usuario_id } }) || 0;
        const totalG = await Gasto.sum('monto', { where: { usuario_id } }) || 0;

        await Metrica.upsert({
            usuario_id,
            total_ventas: totalV,
            total_gastos: totalG,
            saldo: totalV - totalG
        });

        res.status(201).json({ message: `Importación de gastos exitosa` });
    } catch (error) {
        res.status(500).json({ error: 'Error al importar gastos' });
    }
};