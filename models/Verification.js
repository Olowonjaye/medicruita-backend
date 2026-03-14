const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'verifications',
  timestamps: true,
});

module.exports = Verification;
