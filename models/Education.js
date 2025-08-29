const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Education = sequelize.define('Education', {
    degree: {
        type: DataTypes.STRING,
        allowNull: false
    },
    institution: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fieldOfStudy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
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
    tableName: 'educations'
});