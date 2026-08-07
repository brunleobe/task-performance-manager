// SQL Server Automated Database Initializer and Seeder
import mssql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isTrusted = process.env.DB_TRUSTED === 'true';
const serverName = process.env.DB_SERVER || 'localhost';
const hasInstanceName = serverName.includes('\\');

const masterConfig: mssql.config = {
  server: serverName,
  database: 'master',
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
};

// Real bcrypt password hashes:
// admin123   -> $2a$10$oypOvwlWW10t83/WrxaYt.MXE52nlzxXFEOILTdUHP9B9C2NMYOx.
// manager123 -> $2a$10$p0oFt5.GLtWgPqhUaU6eKe.rCrebjXVUvU.MsJiLpjSjqiJu1hHFO
// staff123   -> $2a$10$siVrDSzMNpXTZiahA0xCDOlZtqnEQrmuerG8gK.nYwJ76LB9JwmyO

const runSeed = async () => {
  console.log('🔄 Connecting to SQL Server...');

  let pool: mssql.ConnectionPool | null = null;
  try {
    pool = await new mssql.ConnectionPool(masterConfig).connect();
    const dbName = process.env.DB_NAME || 'TaskFlowDB';

    console.log(`Checking if database "${dbName}" exists...`);
    const dbCheck = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);

    if (dbCheck.recordset.length === 0) {
      console.log(`Creating database "${dbName}"...`);
      await pool.request().query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created.`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }

    await pool.close();

    const dbConfig = { ...masterConfig, database: dbName };
    pool = await new mssql.ConnectionPool(dbConfig).connect();

    console.log('📦 Creating tables and seeding initial data...');

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
      BEGIN
        CREATE TABLE Departments (
          id VARCHAR(36) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL UNIQUE,
          created_at DATETIME2 DEFAULT GETUTCDATE()
        );
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          id VARCHAR(36) PRIMARY KEY,
          email NVARCHAR(150) NOT NULL UNIQUE,
          password_hash NVARCHAR(255) NOT NULL,
          full_name NVARCHAR(100) NOT NULL,
          role NVARCHAR(20) NOT NULL CHECK (role IN ('staff', 'manager', 'admin')),
          department_id VARCHAR(36) FOREIGN KEY REFERENCES Departments(id),
          created_at DATETIME2 DEFAULT GETUTCDATE()
        );
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tasks')
      BEGIN
        CREATE TABLE Tasks (
          id VARCHAR(36) PRIMARY KEY,
          title NVARCHAR(200) NOT NULL,
          description NVARCHAR(MAX),
          assigned_to VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES Users(id),
          created_by VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES Users(id),
          weight_points INT NOT NULL CHECK (weight_points BETWEEN 1 AND 5),
          status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
          due_date DATETIME2 NOT NULL,
          completed_at DATETIME2 NULL,
          created_at DATETIME2 DEFAULT GETUTCDATE()
        );
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KPILogs')
      BEGIN
        CREATE TABLE KPILogs (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES Users(id),
          period NVARCHAR(7) NOT NULL,
          total_weight_assigned INT NOT NULL DEFAULT 0,
          total_weight_completed INT NOT NULL DEFAULT 0,
          on_time_count INT NOT NULL DEFAULT 0,
          kpi_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          updated_at DATETIME2 DEFAULT GETUTCDATE(),
          CONSTRAINT UQ_User_Period UNIQUE (user_id, period)
        );
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Departments WHERE id = 'd1')
      BEGIN
        INSERT INTO Departments (id, name) VALUES ('d1', 'Engineering');
      END
    `);

    const usersToSeed = [
      { id: 'u0', email: 'admin@company.com', pass: '$2a$10$oypOvwlWW10t83/WrxaYt.MXE52nlzxXFEOILTdUHP9B9C2NMYOx.', name: 'System Admin', role: 'admin' },
      { id: 'u1', email: 'manager@company.com', pass: '$2a$10$p0oFt5.GLtWgPqhUaU6eKe.rCrebjXVUvU.MsJiLpjSjqiJu1hHFO', name: 'Rachel Adams', role: 'manager' },
      { id: 'u2', email: 'sarah@company.com', pass: '$2a$10$siVrDSzMNpXTZiahA0xCDOlZtqnEQrmuerG8gK.nYwJ76LB9JwmyO', name: 'Sarah Connor', role: 'staff' },
      { id: 'u3', email: 'alex@company.com', pass: '$2a$10$siVrDSzMNpXTZiahA0xCDOlZtqnEQrmuerG8gK.nYwJ76LB9JwmyO', name: 'Alex Mercer', role: 'staff' },
      { id: 'u4', email: 'james@company.com', pass: '$2a$10$siVrDSzMNpXTZiahA0xCDOlZtqnEQrmuerG8gK.nYwJ76LB9JwmyO', name: 'James Wright', role: 'staff' },
    ];

    for (const u of usersToSeed) {
      const existing = await pool.request().query(`SELECT id FROM Users WHERE id = '${u.id}' OR email = '${u.email}'`);
      if (existing.recordset.length === 0) {
        await pool.request().query(`
          INSERT INTO Users (id, email, password_hash, full_name, role, department_id)
          VALUES ('${u.id}', '${u.email}', '${u.pass}', '${u.name}', '${u.role}', 'd1');
        `);
      } else {
        // Update password hash to make sure login works
        await pool.request().query(`
          UPDATE Users SET password_hash = '${u.pass}' WHERE email = '${u.email}';
        `);
      }
    }

    const period = new Date().toISOString().substring(0, 7);
    const kpisToSeed = [
      { id: `k1_${period}`, uid: 'u2', wAssigned: 14, wDone: 11, onTime: 12, score: 95.20 },
      { id: `k2_${period}`, uid: 'u3', wAssigned: 12, wDone: 9, onTime: 9, score: 88.40 },
      { id: `k3_${period}`, uid: 'u4', wAssigned: 10, wDone: 6, onTime: 6, score: 72.00 },
    ];

    for (const k of kpisToSeed) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM KPILogs WHERE user_id = '${k.uid}' AND period = '${period}')
        BEGIN
          INSERT INTO KPILogs (id, user_id, period, total_weight_assigned, total_weight_completed, on_time_count, kpi_score)
          VALUES ('${k.id}', '${k.uid}', '${period}', ${k.wAssigned}, ${k.wDone}, ${k.onTime}, ${k.score});
        END
      `);
    }

    console.log('🎉 SQL Server Database initialized and seeded successfully with valid password hashes!');
    await pool.close();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ SQL Server Initialization Result:');
    console.error(err.message || err);
    process.exit(1);
  }
};

runSeed();
