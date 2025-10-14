const { sequelize } = require('../db');
const User = require('./User');
const Job = require('./Job');
// const UserProfile = require('./UserProfile');
// const Education = require('./Education');
// const Experience = require('./Experience');
// const Skill = require('./Skill');

// // Associations
// User.hasOne(UserProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
// UserProfile.belongsTo(User, { foreignKey: 'userId' });

// User.hasMany(Education, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Education.belongsTo(User, { foreignKey: 'userId' });

// User.hasMany(Experience, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Experience.belongsTo(User, { foreignKey: 'userId' });

// User.hasMany(Skill, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Skill.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Job, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
  
  Job.belongsTo(User, {
    foreignKey: 'userId',
  });

module.exports = {
    sequelize,
    User,
    Job,
  // UserProfile,
  // Education,
  // Experience,
  // Skill
}