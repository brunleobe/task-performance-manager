"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// SQL Server Automated Database Initializer and Seeder
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const masterConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourPassword123!',
    server: process.env.DB_SERVER || 'localhost',
    database: 'master',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        trustedConnection: process.env.DB_TRUSTED === 'true',
    },
};
const runSeed = async () => {
    console.log('🔄 Connecting to SQL Server...');
    let pool = null;
    try {
        pool = await new mssql_1.default.ConnectionPool(masterConfig).connect();
        const dbName = process.env.DB_NAME || 'TaskFlowDB';
        console.log(`Checking if database "${dbName}" exists...`);
        const dbCheck = await pool.request().query(`SELECT name FROM sys.databases WHERE name = '${dbName}'`);
        if (dbCheck.recordset.length === 0) {
            console.log(`Creating database "${dbName}"...`);
            await pool.request().query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created.`);
        }
        else {
            console.log(`ℹ️ Database "${dbName}" already exists.`);
        }
        await pool.close();
        const dbConfig = { ...masterConfig, database: dbName };
        pool = await new mssql_1.default.ConnectionPool(dbConfig).connect();
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
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM Users WHERE id = 'u1')
      BEGIN
        INSERT INTO Users (id, email, password_hash, full_name, role, department_id) VALUES
        ('u1', 'manager@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'Rachel Adams', 'manager', 'd1'),
        ('u2', 'sarah@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'Sarah Connor', 'staff', 'd1'),
        ('u3', 'alex@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'Alex Mercer', 'staff', 'd1'),
        ('u4', 'james@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'James Wright', 'staff', 'd1');
      END
    `);
        const period = new Date().toISOString().substring(0, 7);
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM KPILogs WHERE user_id = 'u2' AND period = '${period}')
      BEGIN
        INSERT INTO KPILogs (id, user_id, period, total_weight_assigned, total_weight_completed, on_time_count, kpi_score) VALUES
        ('k1_${period}', 'u2', '${period}', 14, 11, 12, 95.20),
        ('k2_${period}', 'u3', '${period}', 12, 9, 9, 88.40),
        ('k3_${period}', 'u4', '${period}', 10, 6, 6, 72.00);
      END
    `);
        console.log('🎉 SQL Server Database initialized and seeded successfully!');
        await pool.close();
        process.exit(0);
    }
    catch (err) {
        console.error('❌ SQL Server Initialization Result:');
        console.error(err.message || err);
        console.log('\n💡 To configure your local SQL Server instance:');
        console.log('   1. Open `server/.env`');
        console.log('   2. Set `DB_USER` and `DB_PASSWORD` for your SQL Server instance');
        console.log('   3. If using Windows Authentication, set `DB_TRUSTED=true`');
        console.log('   4. Run `npm --prefix server run seed` again!\n');
        if (pool)
            await pool.close();
        process.exit(1);
    }
};
runSeed();
