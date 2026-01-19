const { Venta, Metrica, Gasto } = require('../models'); // Asegúrate de importar Gasto para el importJson
const { Op } = require('sequelize');
const { sequelize } = require('../models');
// 1. POST /ventas – Crear venta y actualizar métricas
exports.createVenta = async (req, res) => {
    try {
        const { fecha, categoria, monto, descripcion } = req.body;

        // El usuario_id NO viene del body, se saca del token decodificado por el middleware
        const usuario_id = req.user.id;

        // Crear el registro de venta
        const nuevaVenta = await Venta.create({
            fecha: fecha || new Date(),
            categoria,
            monto,
            descripcion,
            usuario_id
        });

        // ACTUALIZACIÓN DE MÉTRICAS (KPIs agregados - Requisito 1.3)
        // Buscamos la fila de métricas del usuario o la creamos si no existe
        let [metrica] = await Metrica.findOrCreate({
            where: { usuario_id },
            defaults: { total_ventas: 0, total_gastos: 0, saldo: 0 }
        });

        // Sumamos el monto al total de ventas y actualizamos el saldo
        metrica.total_ventas += parseFloat(monto);
        metrica.saldo = metrica.total_ventas - metrica.total_gastos;
        await metrica.save();

        res.status(201).json({
            message: "Venta registrada y métricas actualizadas",
            data: nuevaVenta
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la venta' });
    }
};

// 2. DELETE /ventas/:id – Borrado lógico (Soft Delete - Requisito 1.4 y 1.8)
exports.deleteVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;

        // Buscamos que la venta pertenezca al usuario autenticado
        const venta = await Venta.findOne({ where: { id, usuario_id } });

        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada o no autorizada' });
        }

        // Al estar activo 'paranoid: true', esto solo llena la columna deleted_at
        await venta.destroy();

        res.json({ message: 'Venta eliminada exitosamente (borrado lógico)' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la venta' });
    }
};

// GET /ventas – Listar ventas con filtros
exports.getVentas = async (req, res) => {
    try {
        const { periodo, filtro } = req.query;
        const p = periodo || filtro; // Acepta ambos parámetros
        const usuario_id = req.user.id;
        let where = { usuario_id };

        if (p) {
            let fechaLimite = new Date();
            if (p === 'dia') fechaLimite.setHours(0, 0, 0, 0);
            else if (p === 'semana') fechaLimite.setDate(fechaLimite.getDate() - 7);
            else if (p === 'mes') fechaLimite.setMonth(fechaLimite.getMonth() - 1);
            else if (p === 'año') fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);

            where.fecha = { [Op.gte]: fechaLimite };
        }

        const ventas = await Venta.findAll({ where });
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar ventas' });
    }
}

// POST /import-json – Cargar registros masivos
exports.importJson = async (req, res) => {
    try {
        const { tipo, datos } = req.body; // tipo: 'venta' o 'gasto'
        const usuario_id = req.user.id;

        // Añadimos el usuario_id a cada objeto del array
        const datosConUsuario = datos.map(item => ({ ...item, usuario_id }));

        if (tipo === 'venta') {
            await Venta.bulkCreate(datosConUsuario);
        } else {
            await Gasto.bulkCreate(datosConUsuario);
        }

        res.status(201).json({ message: `Importación de ${tipo}s exitosa` });
    } catch (error) {
        res.status(500).json({ error: 'Error al importar los datos' });
    }
};

exports.getLineChartData = async (req, res) => {
    try {
        const usuario_id = req.user.id;

        // Consultamos ventas y gastos agrupados por fecha
        const data = await sequelize.query(
            `SELECT fecha, 
             SUM(CASE WHEN tipo = 'venta' THEN monto ELSE 0 END) as ventas,
             SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos
             FROM (
                SELECT fecha, monto, 'venta' as tipo FROM ventas WHERE usuario_id = :usuario_id AND deleted_at IS NULL
                UNION ALL
                SELECT fecha, monto, 'gasto' as tipo FROM gastos WHERE usuario_id = :usuario_id AND deleted_at IS NULL
             ) as movimientos
             GROUP BY fecha ORDER BY fecha ASC`,
            {
                replacements: { usuario_id },
                type: sequelize.QueryTypes.SELECT
            }
        );

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos del gráfico' });
    }
};

// PUT /ventas/:id – Actualizar venta
exports.updateVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, categoria, descripcion, fecha } = req.body;
        const usuario_id = req.user.id;

        // 1. Buscar la venta original
        const venta = await Venta.findOne({ where: { id, usuario_id } });

        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // 2. Si el monto cambió, ajustar las métricas
        if (monto !== undefined && parseFloat(monto) !== venta.monto) {
            let metrica = await Metrica.findOne({ where: { usuario_id } });
            if (metrica) {
                // Restamos el monto viejo y sumamos el nuevo
                metrica.total_ventas = metrica.total_ventas - venta.monto + parseFloat(monto);
                metrica.saldo = metrica.total_ventas - metrica.total_gastos;
                await metrica.save();
            }
        }

        // 3. Actualizar el registro
        await venta.update({ monto, categoria, descripcion, fecha });

        res.json({ message: 'Venta actualizada correctamente', data: venta });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la venta' });
    }
};