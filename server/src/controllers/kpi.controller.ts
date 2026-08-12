// KPI Controller (Leaderboard, Summary, CSV Export & Trends)
import { Response } from 'express';
import mssql from 'mssql';
import getPool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// GET /api/kpi/leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || new Date().toISOString().substring(0, 7);
    const pool = await getPool();

    const result = await pool.request()
      .input('period', mssql.VarChar, period)
      .query(`
        SELECT k.id, k.user_id, u.full_name AS user_name, k.period,
               k.total_weight_assigned, k.total_weight_completed,
               k.on_time_count, k.kpi_score
        FROM KPILogs k
        JOIN Users u ON k.user_id = u.id
        WHERE k.period = @period
        ORDER BY k.kpi_score DESC
      `);

    return res.json({ leaderboard: result.recordset });
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
    const pool = await getPool();

    const result = await pool.request()
      .input('userId', mssql.VarChar, userId)
      .input('period', mssql.VarChar, period)
      .query(`
        SELECT id, user_id, period, total_weight_assigned,
               total_weight_completed, on_time_count, kpi_score
        FROM KPILogs
        WHERE user_id = @userId AND period = @period
      `);

    const summary = result.recordset[0] || {
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
    const pool = await getPool();

    const result = await pool.request()
      .input('period', mssql.VarChar, period)
      .query(`
        SELECT u.full_name, k.kpi_score, k.total_weight_assigned,
               k.total_weight_completed, k.on_time_count, k.period
        FROM KPILogs k
        JOIN Users u ON k.user_id = u.id
        WHERE k.period = @period
        ORDER BY k.kpi_score DESC
      `);

    const rows = [
      ['Rank', 'Name', 'KPI Score', 'Weight Assigned', 'Weight Completed', 'On-Time Tasks', 'Period'],
      ...result.recordset.map((k: any, i: number) => [
        i + 1,
        `"${k.full_name}"`,
        `${k.kpi_score.toFixed(1)}%`,
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

// GET /api/kpi/trends — last 6 months of KPI data for all staff (for charts)
export const getTrends = async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getPool();

    // Build list of last 6 period strings (yyyy-MM)
    const periods: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      periods.push(d.toISOString().substring(0, 7));
    }

    const result = await pool.request().query(`
      SELECT k.period, u.full_name AS user_name, k.user_id,
             k.kpi_score, k.total_weight_assigned,
             k.total_weight_completed, k.on_time_count
      FROM KPILogs k
      JOIN Users u ON k.user_id = u.id
      WHERE k.period IN ('${periods.join("','")}')
      ORDER BY k.period ASC, k.kpi_score DESC
    `);

    // Aggregate tasks completed per month across all staff
    const monthlyTotals: Record<string, { completed: number; assigned: number }> = {};
    periods.forEach(p => { monthlyTotals[p] = { completed: 0, assigned: 0 }; });
    result.recordset.forEach((row: any) => {
      if (monthlyTotals[row.period]) {
        monthlyTotals[row.period].completed += row.total_weight_completed;
        monthlyTotals[row.period].assigned  += row.total_weight_assigned;
      }
    });

    return res.json({
      periods,
      records: result.recordset,
      monthlyTotals,
    });
  } catch (err) {
    console.error('Trends Error:', err);
    return res.status(500).json({ message: 'Failed to retrieve trend data' });
  }
};
