"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDepartment = exports.getDepartments = exports.createUser = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const mssql_1 = __importDefault(require("mssql"));
const db_1 = __importDefault(require("../config/db"));
// Input validation schema for user creation
const createUserSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(1, 'Full name is required'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['staff', 'manager', 'admin']),
    department_id: zod_1.z.string().min(1, 'Department is required'),
});
// Input validation for department creation
const createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Department name is required'),
});
// GET /api/admin/users (Retrieve all users with department names)
const getAllUsers = async (req, res) => {
    try {
        const pool = await (0, db_1.default)();
        const result = await pool.request().query(`
      SELECT u.id, u.email, u.full_name, u.role, u.department_id, d.name AS department_name, u.created_at
      FROM Users u
      LEFT JOIN Departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
        return res.json({ users: result.recordset });
    }
    catch (err) {
        console.error('Get All Users Error:', err);
        return res.status(500).json({ message: 'Failed to retrieve users' });
    }
};
exports.getAllUsers = getAllUsers;
// POST /api/admin/users (Create a new user account)
const createUser = async (req, res) => {
    try {
        const payload = createUserSchema.parse(req.body);
        const pool = await (0, db_1.default)();
        // Check if email already exists
        const existing = await pool.request()
            .input('email', mssql_1.default.NVarChar, payload.email)
            .query(`SELECT id FROM Users WHERE email = @email`);
        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: 'Email address already registered' });
        }
        // Hash password with bcryptjs
        const passwordHash = await bcryptjs_1.default.hash(payload.password, 10);
        const userId = `u_${Date.now()}`;
        await pool.request()
            .input('id', mssql_1.default.VarChar, userId)
            .input('email', mssql_1.default.NVarChar, payload.email)
            .input('password_hash', mssql_1.default.NVarChar, passwordHash)
            .input('full_name', mssql_1.default.NVarChar, payload.full_name)
            .input('role', mssql_1.default.NVarChar, payload.role)
            .input('department_id', mssql_1.default.VarChar, payload.department_id)
            .query(`
        INSERT INTO Users (id, email, password_hash, full_name, role, department_id)
        VALUES (@id, @email, @password_hash, @full_name, @role, @department_id)
      `);
        return res.status(201).json({ message: 'User created successfully', userId });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('Create User Error:', err);
        return res.status(500).json({ message: 'Failed to create user' });
    }
};
exports.createUser = createUser;
// GET /api/admin/departments (Retrieve all departments)
const getDepartments = async (req, res) => {
    try {
        const pool = await (0, db_1.default)();
        const result = await pool.request().query(`
      SELECT d.id, d.name, d.created_at, COUNT(u.id) AS user_count
      FROM Departments d
      LEFT JOIN Users u ON d.id = u.department_id
      GROUP BY d.id, d.name, d.created_at
      ORDER BY d.name ASC
    `);
        return res.json({ departments: result.recordset });
    }
    catch (err) {
        console.error('Get Departments Error:', err);
        return res.status(500).json({ message: 'Failed to retrieve departments' });
    }
};
exports.getDepartments = getDepartments;
// POST /api/admin/departments (Create a new department)
const createDepartment = async (req, res) => {
    try {
        const payload = createDepartmentSchema.parse(req.body);
        const pool = await (0, db_1.default)();
        const deptId = `d_${Date.now()}`;
        await pool.request()
            .input('id', mssql_1.default.VarChar, deptId)
            .input('name', mssql_1.default.NVarChar, payload.name.trim())
            .query(`
        INSERT INTO Departments (id, name)
        VALUES (@id, @name)
      `);
        return res.status(201).json({ message: 'Department created successfully', deptId });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('Create Department Error:', err);
        return res.status(500).json({ message: 'Failed to create department' });
    }
};
exports.createDepartment = createDepartment;
