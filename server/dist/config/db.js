"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
// Database configuration and connection pool using 'mssql' driver
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isTrusted = process.env.DB_TRUSTED === 'true';
// Construct SQL Server configuration
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'TaskFlowDB',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true, // Needed for local SQL Server dev environments
        trustedConnection: isTrusted,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
let pool = null;
// Connects to SQL Server and returns connection pool
const getPool = async () => {
    if (pool && pool.connected)
        return pool;
    try {
        pool = await new mssql_1.default.ConnectionPool(config).connect();
        console.log('✅ Connected to SQL Server database:', config.database);
        return pool;
    }
    catch (err) {
        console.error('❌ SQL Server Connection Error:', err.message || err);
        console.warn('💡 Tip: Set DB_USER and DB_PASSWORD in server/.env to match your SQL Server account credentials.');
        throw err;
    }
};
exports.getPool = getPool;
exports.default = exports.getPool;
