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

// Production-ready Sequelize configuration for Render / managed Postgres
// Uses DATABASE_URL when available and enforces SSL with relaxed cert validation
// (Render uses managed certificates; rejectUnauthorized=false is required for some setups)
const databaseUrl = process.env.DATABASE_URL;

const defaultPool = {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
};

let sequelize;
if (databaseUrl) {
    try {
        const hostMatch = databaseUrl.match(/@([^:/]+)([:/]|$)/);
        if (hostMatch) console.info(`DB host from DATABASE_URL: ${hostMatch[1]}`);
    } catch (e) {
        // ignore
    }

    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        pool: defaultPool,
        logging: process.env.SEQUELIZE_LOG === 'true' ? console.log : false,
    });
} else {
    // Local / development fallback using individual env vars
    sequelize = new Sequelize(
        process.env.DB_NAME || 'medicruitadb',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
            dialect: 'postgres',
            pool: defaultPool,
            logging: process.env.SEQUELIZE_LOG === 'true' ? console.log : false,
        }
    );
}

/**
 * connectDb
 * - authenticates the connection and optionally syncs models
 * - throws on failure so the caller (startup) can decide to exit
 */
const connectDb = async (opts = { sync: false }) => {
    try {
        await sequelize.authenticate();
        console.info('✅ Database connection established.');

        if (opts.sync) {
            // In production avoid force:true unless intentionally resetting schema
            await sequelize.sync();
            console.info('✅ Database synced.');
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error && error.message ? error.message : error);
        // rethrow so the caller can decide (e.g. crash on startup in CI/production)
        throw error;
    }
};

module.exports = { sequelize, connectDb };