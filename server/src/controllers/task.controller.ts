// Task Controller — PostgreSQL version
import { Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { recalculateUserKPI } from '../services/kpi.service';
import { createNotification } from './notification.controller';

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
    let result;

    if (user.role === 'staff') {
      result = await pool.query(
        `SELECT t.id, t.title, t.description, t.assigned_to, t.created_by,
                t.weight_points, t.status, t.due_date, t.completed_at, t.created_at,
                u.full_name AS assigned_to_name
         FROM tasks t
         JOIN users u ON t.assigned_to = u.id
         WHERE t.assigned_to = $1
         ORDER BY t.due_date ASC`,
        [user.id]
      );
    } else {
      result = await pool.query(
        `SELECT t.id, t.title, t.description, t.assigned_to, t.created_by,
                t.weight_points, t.status, t.due_date, t.completed_at, t.created_at,
                u.full_name AS assigned_to_name
         FROM tasks t
         JOIN users u ON t.assigned_to = u.id
         ORDER BY t.created_at DESC`
      );
    }

    return res.json({ tasks: result.rows });
  } catch (err) {
    console.error('Get Tasks Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve tasks' });
  }
};

// GET /api/tasks/staff-members — returns all staff users for manager dropdown
export const getStaffMembers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.department_id, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role = 'staff'
       ORDER BY u.full_name ASC`
    );
    return res.json({ users: result.rows });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve staff members' });
  }
};

// POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const payload = createTaskSchema.parse(req.body);
    const taskId = `t_${Date.now()}`;
    const createdBy = req.user!.id;
    const dueDateISO = new Date(payload.due_date).toISOString();

    await pool.query(
      `INSERT INTO tasks (id, title, description, assigned_to, created_by, weight_points, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
      [taskId, payload.title, payload.description, payload.assigned_to, createdBy, payload.weight_points, dueDateISO]
    );

    const currentPeriod = new Date().toISOString().substring(0, 7);
    await recalculateUserKPI(payload.assigned_to, currentPeriod);

    try {
      await createNotification(payload.assigned_to, 'assigned',
        `You have been assigned a new task: "${payload.title}"`, taskId);
    } catch { /* non-critical */ }

    return res.status(201).json({ message: 'Task created successfully', taskId });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    console.error('Create Task Error:', err);
    return res.status(500).json({ message: 'Failed to create task' });
  }
};

// PATCH /api/tasks/:id/complete
export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const completedAt = new Date().toISOString();

    const result = await pool.query(
      `UPDATE tasks
       SET status = 'completed', completed_at = $1
       WHERE id = $2
         AND (assigned_to = $3
              OR $3 IN (SELECT id FROM users WHERE role IN ('manager', 'admin')))
       RETURNING id`,
      [completedAt, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    const currentPeriod = new Date().toISOString().substring(0, 7);
    const updatedKPI = await recalculateUserKPI(userId, currentPeriod);

    try {
      const taskInfo = await pool.query(
        `SELECT title, created_by FROM tasks WHERE id = $1`, [id]
      );
      if (taskInfo.rows.length > 0) {
        const { title, created_by } = taskInfo.rows[0];
        if (created_by !== userId) {
          await createNotification(created_by, 'completed',
            `Task "${title}" has been marked as completed.`, id);
        }
      }
    } catch { /* non-critical */ }

    return res.json({ message: 'Task completed successfully', kpi: updatedKPI });
  } catch (err) {
    console.error('Complete Task Error:', err);
    return res.status(500).json({ message: 'Failed to complete task' });
  }
};

// POST /api/tasks/check-overdue
export const checkOverdue = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date().toISOString();

    const result = await pool.query(
      `UPDATE tasks
       SET status = 'overdue'
       WHERE status IN ('pending', 'in_progress')
         AND due_date < $1
       RETURNING id, assigned_to, title`,
      [now]
    );

    const updated = result.rowCount ?? 0;

    if (updated > 0) {
      for (const task of result.rows) {
        try {
          await createNotification(task.assigned_to, 'overdue',
            `Your task "${task.title}" is overdue. Please complete it as soon as possible.`, task.id);
        } catch { /* non-critical */ }
      }
    }

    return res.json({ message: `${updated} task(s) marked as overdue`, updated });
  } catch (err) {
    console.error('Check Overdue Error:', err);
    return res.status(500).json({ message: 'Failed to check overdue tasks' });
  }
};

// PUT /api/tasks/:id
export const editTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = createTaskSchema.parse(req.body);
    const dueDateISO = new Date(payload.due_date).toISOString();

    const currentTaskReq = await pool.query(
      `SELECT assigned_to FROM tasks WHERE id = $1`, [id]
    );
    if (currentTaskReq.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const oldAssignee = currentTaskReq.rows[0].assigned_to;

    await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, assigned_to = $3,
           weight_points = $4, due_date = $5
       WHERE id = $6`,
      [payload.title, payload.description, payload.assigned_to,
       payload.weight_points, dueDateISO, id]
    );

    const currentPeriod = new Date().toISOString().substring(0, 7);
    await recalculateUserKPI(payload.assigned_to, currentPeriod);
    if (oldAssignee !== payload.assigned_to) {
      await recalculateUserKPI(oldAssignee, currentPeriod);
    }

    return res.json({ message: 'Task updated successfully' });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    console.error('Edit Task Error:', err);
    return res.status(500).json({ message: 'Failed to update task' });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const currentTaskReq = await pool.query(
      `SELECT assigned_to FROM tasks WHERE id = $1`, [id]
    );
    if (currentTaskReq.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    const { assigned_to } = currentTaskReq.rows[0];

    await pool.query(`DELETE FROM notifications WHERE task_id = $1`, [id]);
    await pool.query(`DELETE FROM tasks WHERE id = $1`, [id]);

    const currentPeriod = new Date().toISOString().substring(0, 7);
    await recalculateUserKPI(assigned_to, currentPeriod);

    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete Task Error:', err);
    return res.status(500).json({ message: 'Failed to delete task' });
  }
};
