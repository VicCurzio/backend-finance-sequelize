'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
    }
  }

  Venta.init({
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false
    },
    monto: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Venta',
    tableName: 'ventas',
    underscored: true,
    paranoid: true,
    timestamps: true
  });

  return Venta;
};