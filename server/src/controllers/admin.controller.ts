// Admin Controller — PostgreSQL version
import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

const createUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['staff', 'manager', 'admin']),
  department_id: z.string().min(1, 'Department is required'),
});

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

// GET /api/admin/users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.department_id,
              d.name AS department_name, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );
    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Get All Users Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

// POST /api/admin/users
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const payload = createUserSchema.parse(req.body);

    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [payload.email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const userId = `u_${Date.now()}`;

    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, department_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, payload.email, passwordHash, payload.full_name, payload.role, payload.department_id]
    );

    return res.status(201).json({ message: 'User created successfully', userId });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    console.error('Create User Error:', err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
};

// GET /api/admin/departments
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.created_at, COUNT(u.id)::int AS user_count
       FROM departments d
       LEFT JOIN users u ON d.id = u.department_id
       GROUP BY d.id, d.name, d.created_at
       ORDER BY d.name ASC`
    );
    return res.json({ departments: result.rows });
  } catch (err) {
    console.error('Get Departments Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve departments' });
  }
};

// POST /api/admin/departments
export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const payload = createDepartmentSchema.parse(req.body);
    const deptId = `d_${Date.now()}`;

    await pool.query(
      `INSERT INTO departments (id, name) VALUES ($1, $2)`,
      [deptId, payload.name.trim()]
    );

    return res.status(201).json({ message: 'Department created successfully', deptId });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    console.error('Create Department Error:', err);
    return res.status(500).json({ message: 'Failed to create department' });
  }
};
