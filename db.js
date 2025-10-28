// const { Sequelize } = require('sequelize')
// require('dotenv').config();

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'postgres',
// });

// const connectDb = async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('Connection has been established successfully.');
//     } catch (error) {
//         console.error('Unable to connect to the database:', error);
//     }
// };

// module.exports = {sequelize, connectDb};

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support either a single DATABASE_URL (as provided by Render/Heroku)
// or individual DB_* env vars for local development.
const databaseUrl = process.env.DATABASE_URL;

let sequelize;
if (databaseUrl) {
    try {
        // Non-sensitive debug: print host portion so we can diagnose DNS issues without printing the full URL
        const hostMatch = databaseUrl.match(/@([^:/]+)([:/]|$)/);
        if (hostMatch) console.log(`DB host from DATABASE_URL: ${hostMatch[1]}`);
    } catch (e) {
        // ignore
    }
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                // For managed DB providers (Render), do not reject self-signed certs
                rejectUnauthorized: false,
            },
        },
        logging: false,
    });
} else {
    // Fallback to individual env vars (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
    sequelize = new Sequelize(
        process.env.DB_NAME || 'medicruitadb',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
            dialect: 'postgres',
            logging: false,
        }
    );
}

const connectDb = async (opts = { sync: false }) => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        if (opts.sync) {
            await sequelize.sync();
            console.log('✅ Database synced.');
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error; // rethrow so callers (startup) can fail fast if desired
    }
};

module.exports = { sequelize, connectDb };