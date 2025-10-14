const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const UserProfile = sequelize.define('UserProfile', {
    profilePicture:
    {
        type: DataTypes.STRING,
        allowNull: true
    },
    aboutMe:
    {
        type: DataTypes.TEXT,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
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
    timestamps: true
  });
module.exports = UserProfile;