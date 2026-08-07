// Task Controller (Get, Create, Complete Tasks)
import { Response } from 'express';
import { z } from 'zod';
import mssql from 'mssql';
import getPool from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { recalculateUserKPI } from '../services/kpi.service';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().default(''),
  assigned_to: z.string().min(1, 'Assignee is required'),
  weight_points: z.number().int().min(1).max(5),
  due_date: z.string().min(1, 'Due date is required'),
});

// GET /api/tasks
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const pool = await getPool();

    let query = `
      SELECT t.id, t.title, t.description, t.assigned_to, u.full_name AS assigned_to_name,
             t.created_by, t.weight_points, t.status, t.due_date, t.completed_at, t.created_at
      FROM Tasks t
      LEFT JOIN Users u ON t.assigned_to = u.id
    `;

    if (user.role === 'staff') {
      query += ` WHERE t.assigned_to = @userId ORDER BY t.due_date ASC`;
    } else {
      query += ` ORDER BY t.created_at DESC`;
    }

    const request = pool.request();
    if (user.role === 'staff') {
      request.input('userId', mssql.VarChar, user.id);
    }

    const result = await request.query(query);
    return res.json({ tasks: result.recordset });
  } catch (err) {
    console.error('Get Tasks Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve tasks' });
  }
};

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const payload = createTaskSchema.parse(req.body);
    const pool = await getPool();

    const taskId = `t_${Date.now()}`;
    const createdBy = req.user!.id;
    const dueDateISO = new Date(payload.due_date).toISOString();

    await pool.request()
      .input('id', mssql.VarChar, taskId)
      .input('title', mssql.NVarChar, payload.title)
      .input('description', mssql.NVarChar, payload.description)
      .input('assigned_to', mssql.VarChar, payload.assigned_to)
      .input('created_by', mssql.VarChar, createdBy)
      .input('weight_points', mssql.Int, payload.weight_points)
      .input('status', mssql.NVarChar, 'pending')
      .input('due_date', mssql.DateTime2, dueDateISO)
      .query(`
        INSERT INTO Tasks (id, title, description, assigned_to, created_by, weight_points, status, due_date)
        VALUES (@id, @title, @description, @assigned_to, @created_by, @weight_points, @status, @due_date)
      `);

    const currentPeriod = new Date().toISOString().substring(0, 7);
    await recalculateUserKPI(payload.assigned_to, currentPeriod);

    return res.status(201).json({ message: 'Task created successfully', taskId });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Create Task Error:', err);
    return res.status(500).json({ message: 'Failed to create task' });
  }
};

// PATCH /api/tasks/:id/complete
export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const pool = await getPool();
    const completedAt = new Date().toISOString();

    const result = await pool.request()
      .input('id', mssql.VarChar, id)
      .input('userId', mssql.VarChar, userId)
      .input('completedAt', mssql.DateTime2, completedAt)
      .query(`
        UPDATE Tasks
        SET status = 'completed', completed_at = @completedAt
        WHERE id = @id AND (assigned_to = @userId OR @userId IN (SELECT id FROM Users WHERE role IN ('manager', 'admin')))
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    const currentPeriod = new Date().toISOString().substring(0, 7);
    const updatedKPI = await recalculateUserKPI(userId, currentPeriod);

    return res.json({ message: 'Task completed successfully', kpi: updatedKPI });
  } catch (err) {
    console.error('Complete Task Error:', err);
    return res.status(500).json({ message: 'Failed to complete task' });
  }
};
