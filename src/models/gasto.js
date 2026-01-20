'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Gasto extends Model {
    static associate(models) {
    }
  }
  Gasto.init({
    fecha: DataTypes.DATE,
    categoria: DataTypes.STRING,
    monto: DataTypes.FLOAT,
    descripcion: DataTypes.STRING,
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Gasto',
    tableName: 'gastos',
    underscored: true,
    paranoid: true,
    timestamps: true
  });
  return Gasto;
};