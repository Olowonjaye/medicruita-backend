const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const User = require('./User'); // Import User model for association

const Job = sequelize.define('Job', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    salary: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    employmentType: {
        type: DataTypes.ENUM('full-time', 'contract', "internship", 'locum'),
        allowNull: false
    },
    employmentLevel: {
        type: DataTypes.ENUM('entry', 'mid', 'senior', "director"),
        allowNull: false
    },
    organization: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: User, // ✅ this uses the actual model and respects `tableName: 'users'`
          key: 'id'
        }
      }
}, {
    timestamps: true,
    tableName: 'jobs'
})
module.exports = Job;