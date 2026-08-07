// Database configuration and connection pool using 'mssql' driver
import mssql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isTrusted = process.env.DB_TRUSTED === 'true';
const serverName = process.env.DB_SERVER || 'localhost';
const hasInstanceName = serverName.includes('\\');

// Construct SQL Server configuration
const config: mssql.config = {
  server: serverName,
  database: process.env.DB_NAME || 'TaskFlowDB',
  ...(!hasInstanceName && process.env.DB_PORT ? { port: parseInt(process.env.DB_PORT, 10) } : {}),
  ...(isTrusted
    ? {}
    : {
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD || 'YourPassword123!',
      }),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    trustedConnection: isTrusted,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: mssql.ConnectionPool | null = null;

// Connects to SQL Server and returns connection pool
export const getPool = async (): Promise<mssql.ConnectionPool> => {
  if (pool && pool.connected) return pool;

  try {
    pool = await new mssql.ConnectionPool(config).connect();
    console.log('✅ Connected to SQL Server database:', config.database);
    return pool;
  } catch (err: any) {
    console.error('❌ SQL Server Connection Error:', err.message || err);
    console.warn('💡 Tip: Set DB_USER and DB_PASSWORD in server/.env to match your SQL Server account credentials.');
    throw err;
  }
};

export default getPool;
