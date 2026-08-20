// KPI Controller — PostgreSQL version
import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/kpi/leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || new Date().toISOString().substring(0, 7);

    const result = await pool.query(
      `SELECT k.id, k.user_id, u.full_name AS user_name, k.period,
              k.total_weight_assigned, k.total_weight_completed,
              k.on_time_count, k.kpi_score
       FROM kpi_logs k
       JOIN users u ON k.user_id = u.id
       WHERE k.period = $1
       ORDER BY k.kpi_score DESC`,
      [period]
    );

    return res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('Leaderboard Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve leaderboard' });
  }
};

// GET /api/kpi/my-summary
export const getMySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = new Date().toISOString().substring(0, 7);

    const result = await pool.query(
      `SELECT id, user_id, period, total_weight_assigned,
              total_weight_completed, on_time_count, kpi_score
       FROM kpi_logs
       WHERE user_id = $1 AND period = $2`,
      [userId, period]
    );

    const summary = result.rows[0] || {
      user_id: userId,
      period,
      total_weight_assigned: 0,
      total_weight_completed: 0,
      on_time_count: 0,
      kpi_score: 0,
    };

    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve KPI summary' });
  }
};

// GET /api/kpi/export
export const exportReport = async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || new Date().toISOString().substring(0, 7);

    const result = await pool.query(
      `SELECT u.full_name, k.kpi_score, k.total_weight_assigned,
              k.total_weight_completed, k.on_time_count, k.period
       FROM kpi_logs k
       JOIN users u ON k.user_id = u.id
       WHERE k.period = $1
       ORDER BY k.kpi_score DESC`,
      [period]
    );

    const rows = [
      ['Rank', 'Name', 'KPI Score', 'Weight Assigned', 'Weight Completed', 'On-Time Tasks', 'Period'],
      ...result.rows.map((k: any, i: number) => [
        i + 1,
        `"${k.full_name}"`,
        `${Number(k.kpi_score).toFixed(1)}%`,
        k.total_weight_assigned,
        k.total_weight_completed,
        k.on_time_count,
        k.period,
      ]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="team-kpi-${period}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to export CSV report' });
  }
};

// GET /api/kpi/trends — last 6 months
export const getTrends = async (req: AuthRequest, res: Response) => {
  try {
    const periods: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      periods.push(d.toISOString().substring(0, 7));
    }

    const result = await pool.query(
      `SELECT k.period, u.full_name AS user_name, k.user_id,
              k.kpi_score, k.total_weight_assigned,
              k.total_weight_completed, k.on_time_count
       FROM kpi_logs k
       JOIN users u ON k.user_id = u.id
       WHERE k.period = ANY($1::text[])
       ORDER BY k.period ASC, k.kpi_score DESC`,
      [periods]
    );

    const monthlyTotals: Record<string, { completed: number; assigned: number }> = {};
    periods.forEach(p => { monthlyTotals[p] = { completed: 0, assigned: 0 }; });
    result.rows.forEach((row: any) => {
      if (monthlyTotals[row.period]) {
        monthlyTotals[row.period].completed += Number(row.total_weight_completed);
        monthlyTotals[row.period].assigned  += Number(row.total_weight_assigned);
      }
    });

    return res.json({ periods, records: result.rows, monthlyTotals });
  } catch (err) {
    console.error('Trends Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve trend data' });
  }
};
