// Admin Controller (User & Department Management)
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import mssql from 'mssql';
import getPool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// Input validation schema for user creation
const createUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['staff', 'manager', 'admin']),
  department_id: z.string().min(1, 'Department is required'),
});

// Input validation for department creation
const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

// GET /api/admin/users (Retrieve all users with department names)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT u.id, u.email, u.full_name, u.role, u.department_id, d.name AS department_name, u.created_at
      FROM Users u
      LEFT JOIN Departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);

    return res.json({ users: result.recordset });
  } catch (err) {
    console.error('Get All Users Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

// POST /api/admin/users (Create a new user account)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const payload = createUserSchema.parse(req.body);
    const pool = await getPool();

    // Check if email already exists
    const existing = await pool.request()
      .input('email', mssql.NVarChar, payload.email)
      .query(`SELECT id FROM Users WHERE email = @email`);

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const userId = `u_${Date.now()}`;

    await pool.request()
      .input('id', mssql.VarChar, userId)
      .input('email', mssql.NVarChar, payload.email)
      .input('password_hash', mssql.NVarChar, passwordHash)
      .input('full_name', mssql.NVarChar, payload.full_name)
      .input('role', mssql.NVarChar, payload.role)
      .input('department_id', mssql.VarChar, payload.department_id)
      .query(`
        INSERT INTO Users (id, email, password_hash, full_name, role, department_id)
        VALUES (@id, @email, @password_hash, @full_name, @role, @department_id)
      `);

    return res.status(201).json({ message: 'User created successfully', userId });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Create User Error:', err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
};

// GET /api/admin/departments (Retrieve all departments)
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT d.id, d.name, d.created_at, COUNT(u.id) AS user_count
      FROM Departments d
      LEFT JOIN Users u ON d.id = u.department_id
      GROUP BY d.id, d.name, d.created_at
      ORDER BY d.name ASC
    `);

    return res.json({ departments: result.recordset });
  } catch (err) {
    console.error('Get Departments Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve departments' });
  }
};

// POST /api/admin/departments (Create a new department)
export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const payload = createDepartmentSchema.parse(req.body);
    const pool = await getPool();

    const deptId = `d_${Date.now()}`;

    await pool.request()
      .input('id', mssql.VarChar, deptId)
      .input('name', mssql.NVarChar, payload.name.trim())
      .query(`
        INSERT INTO Departments (id, name)
        VALUES (@id, @name)
      `);

    return res.status(201).json({ message: 'Department created successfully', deptId });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Create Department Error:', err);
    return res.status(500).json({ message: 'Failed to create department' });
  }
};
