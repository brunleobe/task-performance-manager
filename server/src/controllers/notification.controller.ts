// Notifications Controller — PostgreSQL version
import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await pool.query(
      `SELECT id, user_id, type, message, task_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Get Notifications Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark notification' });
  }
};

// POST /api/notifications/mark-all-read
export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [userId]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark all notifications' });
  }
};

// Internal helper: create a notification record
export const createNotification = async (
  userId: string,
  type: 'assigned' | 'completed' | 'overdue',
  message: string,
  taskId?: string
) => {
  const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  await pool.query(
    `INSERT INTO notifications (id, user_id, type, message, task_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, type, message, taskId ?? null]
  );
};
