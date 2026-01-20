'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Metrica extends Model {
    static associate(models) {
    }
  }

  Metrica.init({
    total_ventas: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    total_gastos: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    saldo: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Metrica',
    tableName: 'metricas',
    underscored: true,
    timestamps: true
  });

  return Metrica;
};