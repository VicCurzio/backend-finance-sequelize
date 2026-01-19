const { Gasto, Metrica } = require('../models');
const { Op } = require('sequelize');

exports.createGasto = async (req, res) => {
    try {
        const { fecha, categoria, monto, descripcion } = req.body;
        const usuario_id = req.user.id; // Del JWT

        const gasto = await Gasto.create({ fecha, categoria, monto, descripcion, usuario_id });

        // Actualizar Métricas (Restar del saldo)
        let [metrica] = await Metrica.findOrCreate({ where: { usuario_id } });
        metrica.total_gastos += parseFloat(monto);
        metrica.saldo = metrica.total_ventas - metrica.total_gastos;
        await metrica.save();

        res.status(201).json(gasto);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear gasto' });
    }
};

// GET /gastos – Listar con filtros
exports.getGastos = async (req, res) => {
    try {
        const { filtro, periodo } = req.query;
        const p = filtro || periodo;
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

        const gastos = await Gasto.findAll({ where });
        res.json(gastos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener gastos' });
    }
};

// PUT /gastos/:id – Actualizar
exports.updateGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, categoria, descripcion, fecha } = req.body;
        const usuario_id = req.user.id;

        const gasto = await Gasto.findOne({ where: { id, usuario_id } });
        if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

        // Ajustar métricas si el monto cambia
        if (monto !== undefined && parseFloat(monto) !== gasto.monto) {
            let metrica = await Metrica.findOne({ where: { usuario_id } });
            if (metrica) {
                metrica.total_gastos = metrica.total_gastos - gasto.monto + parseFloat(monto);
                metrica.saldo = metrica.total_ventas - metrica.total_gastos;
                await metrica.save();
            }
        }

        await gasto.update({ monto, categoria, descripcion, fecha });
        res.json({ message: 'Gasto actualizado', data: gasto });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar gasto' });
    }
};

// DELETE /gastos/:id – Borrado lógico
exports.deleteGasto = async (req, res) => {
    try {
        const { id } = req.params;
        await Gasto.destroy({ where: { id, usuario_id: req.user.id } });
        res.json({ message: 'Gasto eliminado (soft delete)' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar gasto' });
    }
};