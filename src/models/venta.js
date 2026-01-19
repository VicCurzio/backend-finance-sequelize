'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      // Como indicaste, no hay FK física con Usuarios
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
      allowNull: false // Se extrae del JWT en el controlador
    }
  }, {
    sequelize,
    modelName: 'Venta',
    tableName: 'ventas',
    underscored: true,
    paranoid: true, // REQUISITO: Soft Delete (deleted_at)
    timestamps: true
  });

  return Venta;
};