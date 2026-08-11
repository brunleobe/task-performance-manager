// Notifications Controller — fetch, read, and create notifications
import { Response } from 'express';
import mssql from 'mssql';
import getPool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/notifications — fetch all notifications for logged-in user (newest first)
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const pool = await getPool();
    const result = await pool.request()
      .input('userId', mssql.VarChar, userId)
      .query(`
        SELECT id, user_id, type, message, task_id, is_read, created_at
        FROM Notifications
        WHERE user_id = @userId
        ORDER BY created_at DESC
      `);
    return res.json({ notifications: result.recordset });
  } catch (err) {
    console.error('Get Notifications Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
};

// PATCH /api/notifications/:id/read — mark one notification as read
export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const pool = await getPool();
    await pool.request()
      .input('id', mssql.VarChar, id)
      .input('userId', mssql.VarChar, userId)
      .query(`UPDATE Notifications SET is_read = 1 WHERE id = @id AND user_id = @userId`);
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark notification' });
  }
};

// POST /api/notifications/mark-all-read — mark all of user's notifications as read
export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const pool = await getPool();
    await pool.request()
      .input('userId', mssql.VarChar, userId)
      .query(`UPDATE Notifications SET is_read = 1 WHERE user_id = @userId`);
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark all notifications' });
  }
};

// Internal helper: create a notification record (used by other controllers)
export const createNotification = async (
  pool: mssql.ConnectionPool,
  userId: string,
  type: 'assigned' | 'completed' | 'overdue',
  message: string,
  taskId?: string
) => {
  const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await pool.request()
    .input('id', mssql.VarChar, id)
    .input('userId', mssql.VarChar, userId)
    .input('type', mssql.VarChar, type)
    .input('message', mssql.NVarChar, message)
    .input('taskId', mssql.VarChar, taskId ?? null)
    .query(`
      INSERT INTO Notifications (id, user_id, type, message, task_id)
      VALUES (@id, @userId, @type, @message, @taskId)
    `);
};
