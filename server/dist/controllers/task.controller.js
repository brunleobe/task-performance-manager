"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTask = exports.createTask = exports.getTasks = void 0;
const zod_1 = require("zod");
const mssql_1 = __importDefault(require("mssql"));
const db_1 = __importDefault(require("../config/db"));
const kpi_service_1 = require("../services/kpi.service");
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required'),
    description: zod_1.z.string().optional().default(''),
    assigned_to: zod_1.z.string().min(1, 'Assignee is required'),
    weight_points: zod_1.z.number().int().min(1).max(5),
    due_date: zod_1.z.string().min(1, 'Due date is required'),
});
// GET /api/tasks
const getTasks = async (req, res) => {
    try {
        const user = req.user;
        const pool = await (0, db_1.default)();
        let query = `
      SELECT t.id, t.title, t.description, t.assigned_to, u.full_name AS assigned_to_name,
             t.created_by, t.weight_points, t.status, t.due_date, t.completed_at, t.created_at
      FROM Tasks t
      LEFT JOIN Users u ON t.assigned_to = u.id
    `;
        if (user.role === 'staff') {
            query += ` WHERE t.assigned_to = @userId ORDER BY t.due_date ASC`;
        }
        else {
            query += ` ORDER BY t.created_at DESC`;
        }
        const request = pool.request();
        if (user.role === 'staff') {
            request.input('userId', mssql_1.default.VarChar, user.id);
        }
        const result = await request.query(query);
        return res.json({ tasks: result.recordset });
    }
    catch (err) {
        console.error('Get Tasks Error:', err);
        return res.status(500).json({ message: 'Failed to retrieve tasks' });
    }
};
exports.getTasks = getTasks;
// POST /api/tasks
const createTask = async (req, res) => {
    try {
        const payload = createTaskSchema.parse(req.body);
        const pool = await (0, db_1.default)();
        const taskId = `t_${Date.now()}`;
        const createdBy = req.user.id;
        const dueDateISO = new Date(payload.due_date).toISOString();
        await pool.request()
            .input('id', mssql_1.default.VarChar, taskId)
            .input('title', mssql_1.default.NVarChar, payload.title)
            .input('description', mssql_1.default.NVarChar, payload.description)
            .input('assigned_to', mssql_1.default.VarChar, payload.assigned_to)
            .input('created_by', mssql_1.default.VarChar, createdBy)
            .input('weight_points', mssql_1.default.Int, payload.weight_points)
            .input('status', mssql_1.default.NVarChar, 'pending')
            .input('due_date', mssql_1.default.DateTime2, dueDateISO)
            .query(`
        INSERT INTO Tasks (id, title, description, assigned_to, created_by, weight_points, status, due_date)
        VALUES (@id, @title, @description, @assigned_to, @created_by, @weight_points, @status, @due_date)
      `);
        const currentPeriod = new Date().toISOString().substring(0, 7);
        await (0, kpi_service_1.recalculateUserKPI)(payload.assigned_to, currentPeriod);
        return res.status(201).json({ message: 'Task created successfully', taskId });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('Create Task Error:', err);
        return res.status(500).json({ message: 'Failed to create task' });
    }
};
exports.createTask = createTask;
// PATCH /api/tasks/:id/complete
const completeTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const pool = await (0, db_1.default)();
        const completedAt = new Date().toISOString();
        const result = await pool.request()
            .input('id', mssql_1.default.VarChar, id)
            .input('userId', mssql_1.default.VarChar, userId)
            .input('completedAt', mssql_1.default.DateTime2, completedAt)
            .query(`
        UPDATE Tasks
        SET status = 'completed', completed_at = @completedAt
        WHERE id = @id AND (assigned_to = @userId OR @userId IN (SELECT id FROM Users WHERE role IN ('manager', 'admin')))
      `);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        const currentPeriod = new Date().toISOString().substring(0, 7);
        const updatedKPI = await (0, kpi_service_1.recalculateUserKPI)(userId, currentPeriod);
        return res.json({ message: 'Task completed successfully', kpi: updatedKPI });
    }
    catch (err) {
        console.error('Complete Task Error:', err);
        return res.status(500).json({ message: 'Failed to complete task' });
    }
};
exports.completeTask = completeTask;
