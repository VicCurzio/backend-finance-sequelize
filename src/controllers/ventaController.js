const { Venta, Metrica, Gasto } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

// 1. POST /ventas
exports.createVenta = async (req, res) => {
    try {
        const { fecha, categoria, monto, descripcion } = req.body;
        const usuario_id = req.user.id;
        const fechaNormalizada = fecha ? new Date(fecha + "T12:00:00") : new Date();

        const nuevaVenta = await Venta.create({
            fecha: fechaNormalizada,
            categoria,
            monto,
            descripcion,
            usuario_id
        });

        let [metrica] = await Metrica.findOrCreate({
            where: { usuario_id },
            defaults: { total_ventas: 0, total_gastos: 0, saldo: 0 }
        });

        metrica.total_ventas += parseFloat(monto);
        metrica.saldo = metrica.total_ventas - metrica.total_gastos;
        await metrica.save();

        res.status(201).json({ message: "Venta registrada", data: nuevaVenta });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar la venta' });
    }
};

// 2. GET /ventas
exports.getVentas = async (req, res) => {
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
                    const [anioM, mesM] = fechaSeleccionada.split('-');
                    inicio = new Date(anioM, mesM - 1, 1, 0, 0, 0);
                    fin = new Date(anioM, mesM, 0, 23, 59, 59);
                    break;
                case 'año':
                    inicio = new Date(fechaSeleccionada, 0, 1, 0, 0, 0);
                    fin = new Date(fechaSeleccionada, 11, 31, 23, 59, 59);
                    break;
            }
            if (inicio && fin) where.fecha = { [Op.between]: [inicio, fin] };
        }

        const ventas = await Venta.findAll({ where, order: [['fecha', 'DESC']] });
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar ventas' });
    }
};

// 3. PUT /ventas/:id - ACTUALIZADO CON FIX DE FECHA
exports.updateVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, categoria, descripcion, fecha } = req.body;
        const usuario_id = req.user.id;

        const venta = await Venta.findOne({ where: { id, usuario_id } });
        if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

        // Actualizar métricas si cambia el monto
        if (monto !== undefined) {
            const nuevoMonto = parseFloat(monto);
            const montoAnterior = parseFloat(venta.monto);
            if (nuevoMonto !== montoAnterior) {
                let [metrica] = await Metrica.findOrCreate({
                    where: { usuario_id },
                    defaults: { total_ventas: 0, total_gastos: 0, saldo: 0 }
                });
                metrica.total_ventas = (metrica.total_ventas - montoAnterior) + nuevoMonto;
                metrica.saldo = metrica.total_ventas - metrica.total_gastos;
                await metrica.save();
            }
        }

        // VALIDACIÓN DE FECHA PARA POSTGRES
        let fechaFinal = venta.fecha;
        if (fecha && fecha !== 'Invalid date') {
            const d = new Date(fecha + "T12:00:00");
            if (!isNaN(d.getTime())) {
                fechaFinal = d;
            }
        }

        await venta.update({
            monto: monto !== undefined ? parseFloat(monto) : venta.monto,
            categoria: categoria || venta.categoria,
            descripcion: descripcion || venta.descripcion,
            fecha: fechaFinal
        });

        res.json({ message: 'Venta actualizada', data: venta });
    } catch (error) {
        console.error("Error en Update:", error);
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

// 4. DELETE /ventas/:id
exports.deleteVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Venta.findOne({ where: { id, usuario_id: req.user.id } });
        if (!venta) return res.status(404).json({ error: 'No existe el registro' });

        let metrica = await Metrica.findOne({ where: { usuario_id: req.user.id } });
        if (metrica) {
            metrica.total_ventas -= venta.monto;
            metrica.saldo = metrica.total_ventas - metrica.total_gastos;
            await metrica.save();
        }

        await venta.destroy();
        res.json({ message: 'Eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};

// 5. GET /dashboard/line-chart
exports.getLineChartData = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const data = await sequelize.query(
            `SELECT 
                DATE(movimientos.fecha) as fecha, 
                SUM(CASE WHEN tipo = 'venta' THEN monto ELSE 0 END) as ventas,
                SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
             FROM (
                SELECT fecha, monto, 'venta' as tipo FROM ventas WHERE usuario_id = :usuario_id AND "deleted_at" IS NULL
                UNION ALL
                SELECT fecha, monto, 'gasto' as tipo FROM gastos WHERE usuario_id = :usuario_id AND "deleted_at" IS NULL
             ) as movimientos
             GROUP BY DATE(movimientos.fecha) 
             ORDER BY fecha ASC`,
            { replacements: { usuario_id }, type: sequelize.QueryTypes.SELECT }
        );
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error en gráfico' });
    }
};

// 6. POST /import-json
exports.importJson = async (req, res) => {
    try {
        const { tipo, datos } = req.body;
        const usuario_id = req.user.id;

        const datosConUsuario = datos.map(item => ({
            ...item,
            usuario_id,
            fecha: item.fecha ? new Date(item.fecha + "T12:00:00") : new Date()
        }));

        if (tipo === 'venta') await Venta.bulkCreate(datosConUsuario);
        else await Gasto.bulkCreate(datosConUsuario);

        const totalV = await Venta.sum('monto', { where: { usuario_id } }) || 0;
        const totalG = await Gasto.sum('monto', { where: { usuario_id } }) || 0;
        await Metrica.upsert({ usuario_id, total_ventas: totalV, total_gastos: totalG, saldo: totalV - totalG });

        res.status(201).json({ message: `Importación de ${tipo} exitosa` });
    } catch (error) {
        res.status(500).json({ error: 'Error al importar' });
    }
};