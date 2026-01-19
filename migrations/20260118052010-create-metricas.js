'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('metricas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      total_ventas: { type: Sequelize.FLOAT, defaultValue: 0 },
      total_gastos: { type: Sequelize.FLOAT, defaultValue: 0 },
      saldo: { type: Sequelize.FLOAT, defaultValue: 0 },
      usuario_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('metricas');
  }
};