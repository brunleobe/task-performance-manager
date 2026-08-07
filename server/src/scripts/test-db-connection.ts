// Database Connection Verification Utility Script
import mssql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const port = parseInt(process.env.DB_PORT || '1433', 10);
const dbName = process.env.DB_NAME || 'TaskFlowDB';

async function testConnection() {
  console.log('🔍 Testing connection to local SQL Server (port 1433)...');

  // Test 1: Try Windows Auth (Trusted Connection)
  console.log('\n--- Test 1: Testing Windows Authentication (DB_TRUSTED=true) ---');
  try {
    const pool = await mssql.connect({
      server: 'localhost',
      port,
      database: 'master',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true,
      },
      connectionTimeout: 4000,
    });
    console.log('✅ Windows Authentication SUCCEEDED!');
    
    // Check if TaskFlowDB exists
    const res = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);
    const dbExists = res.recordset.length > 0;
    console.log(`   Database "${dbName}": ${dbExists ? 'EXISTS ✅' : 'NOT FOUND (Run seed script!) ⚠️'}`);
    
    await pool.close();
    console.log('\n💡 RECOMMENDATION: Set `DB_TRUSTED=true` in server/.env!');
    process.exit(0);
  } catch (err: any) {
    console.log(`❌ Windows Auth failed: ${err.message || err}`);
  }

  // Test 2: Try SQL Authentication (user: sa)
  console.log('\n--- Test 2: Testing SQL Authentication (sa user) ---');
  try {
    const pool = await mssql.connect({
      server: 'localhost',
      port,
      database: 'master',
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || 'YourPassword123!',
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      connectionTimeout: 4000,
    });
    console.log('✅ SQL Authentication SUCCEEDED!');

    // Check if TaskFlowDB exists
    const res = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);
    const dbExists = res.recordset.length > 0;
    console.log(`   Database "${dbName}": ${dbExists ? 'EXISTS ✅' : 'NOT FOUND (Run seed script!) ⚠️'}`);

    await pool.close();
    console.log('\n💡 RECOMMENDATION: Set `DB_TRUSTED=false` in server/.env with your `sa` password!');
    process.exit(0);
  } catch (err: any) {
    console.log(`❌ SQL Auth failed: ${err.message || err}`);
  }

  console.log('\n❌ Could not connect using default Windows Auth or `sa` credentials.');
  console.log('💡 In SSMS: Ensure `sa` user is enabled OR enable Windows Authentication for TaskFlowDB.');
  process.exit(1);
}

testConnection();
