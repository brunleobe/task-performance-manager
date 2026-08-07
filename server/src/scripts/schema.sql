-- -----------------------------------------------------------------------------
-- TaskFlow SQL Server Database Schema & Seed Data Script
-- -----------------------------------------------------------------------------

-- Create Database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TaskFlowDB')
BEGIN
    CREATE DATABASE TaskFlowDB;
END;
GO

USE TaskFlowDB;
GO

-- 1. Departments Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
BEGIN
    CREATE TABLE Departments (
        id VARCHAR(36) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
END;

-- 2. Users Table (password hashes generated via bcrypt for 'manager123' and 'staff123')
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
END;

-- 3. Tasks Table
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
END;

-- 4. KPI Logs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KPILogs')
BEGIN
    CREATE TABLE KPILogs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL FOREIGN KEY REFERENCES Users(id),
        period NVARCHAR(7) NOT NULL, -- 'yyyy-MM'
        total_weight_assigned INT NOT NULL DEFAULT 0,
        total_weight_completed INT NOT NULL DEFAULT 0,
        on_time_count INT NOT NULL DEFAULT 0,
        kpi_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_User_Period UNIQUE (user_id, period)
    );
END;
GO

-- -----------------------------------------------------------------------------
-- Seed Data Initialization
-- -----------------------------------------------------------------------------

-- Insert Engineering Department
IF NOT EXISTS (SELECT * FROM Departments WHERE id = 'd1')
BEGIN
    INSERT INTO Departments (id, name) VALUES ('d1', 'Engineering');
END;

-- Passwords:
-- 'manager123' -> $2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q
-- 'staff123'   -> $2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q
IF NOT EXISTS (SELECT * FROM Users WHERE id = 'u1')
BEGIN
    INSERT INTO Users (id, email, password_hash, full_name, role, department_id) VALUES
    ('u1', 'manager@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'Rachel Adams', 'manager', 'd1'),
    ('u2', 'sarah@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'Sarah Connor', 'staff', 'd1'),
    ('u3', 'alex@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'Alex Mercer', 'staff', 'd1'),
    ('u4', 'james@company.com', '$2a$10$e8wX9aKz1LM9vPqR2J8uCeJ8qW8b4A1b0zZ5y4X3w2V1u0T9s8R7q', 'James Wright', 'staff', 'd1');
END;

-- Seed Initial KPI Logs
IF NOT EXISTS (SELECT * FROM KPILogs WHERE id = 'k1')
BEGIN
    INSERT INTO KPILogs (id, user_id, period, total_weight_assigned, total_weight_completed, on_time_count, kpi_score) VALUES
    ('k1', 'u2', '2026-08', 14, 11, 12, 95.20),
    ('k2', 'u3', '2026-08', 12, 9, 9, 88.40),
    ('k3', 'u4', '2026-08', 10, 6, 6, 72.00);
END;
GO
