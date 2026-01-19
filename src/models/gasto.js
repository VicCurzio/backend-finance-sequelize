'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Gasto extends Model {
    static associate(models) {
      // define association here
    }
  }
  Gasto.init({
    fecha: DataTypes.DATE,
    categoria: DataTypes.STRING,
    monto: DataTypes.FLOAT,
    descripcion: DataTypes.STRING,
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false // Requisito: dejar asentado qué usuario dejó el registro
    }
  }, {
    sequelize,
    modelName: 'Gasto',
    tableName: 'gastos', // Nombre real en plural y minúsculas
    underscored: true,   // Para que use created_at, updated_at y deleted_at
    paranoid: true,      // REQUISITO: Eliminar gasto (soft delete - delete lógico)
    timestamps: true     // Habilita el seguimiento de fechas
  });
  return Gasto;
};