const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Experience = sequelize.define('Experience', {
    jobTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    organization: {
        type: DataTypes.STRING,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Name of the table
            key: 'id' // Column name in the users table
        }
    }
}, {
    timestamps: true,
    tableName: 'experiences'
});