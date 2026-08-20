// KPI Recalculation Service — PostgreSQL version
import { pool } from '../config/db';

export const recalculateUserKPI = async (userId: string, period: string) => {
  // Get task stats for user in given period (YYYY-MM)
  const statsResult = await pool.query(
    `SELECT
       COALESCE(SUM(weight_points), 0)::int AS total_assigned_weight,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN weight_points ELSE 0 END), 0)::int AS total_completed_weight,
       COALESCE(SUM(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 ELSE 0 END), 0)::int AS on_time_count,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0)::int AS total_completed_count
     FROM tasks
     WHERE assigned_to = $1
       AND TO_CHAR(created_at, 'YYYY-MM') = $2`,
    [userId, period]
  );

  const stats = statsResult.rows[0];
  const totalAssigned = Number(stats.total_assigned_weight);
  const totalCompleted = Number(stats.total_completed_weight);
  const onTime = Number(stats.on_time_count);
  const totalCompletedCount = Number(stats.total_completed_count);

  let score = 0;
  if (totalAssigned > 0 && totalCompletedCount > 0) {
    const completionRate = (totalCompleted / totalAssigned) * 0.7;
    const timelinessRate = (onTime / totalCompletedCount) * 0.3;
    score = (completionRate + timelinessRate) * 100;
  }
  score = Math.min(100, Math.round(score * 10) / 10);

  const kpiId = `k_${userId}_${period}`;

  // UPSERT KPI log (PostgreSQL syntax)
  await pool.query(
    `INSERT INTO kpi_logs (id, user_id, period, total_weight_assigned, total_weight_completed, on_time_count, kpi_score, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, period) DO UPDATE SET
       total_weight_assigned  = EXCLUDED.total_weight_assigned,
       total_weight_completed = EXCLUDED.total_weight_completed,
       on_time_count          = EXCLUDED.on_time_count,
       kpi_score              = EXCLUDED.kpi_score,
       updated_at             = CURRENT_TIMESTAMP`,
    [kpiId, userId, period, totalAssigned, totalCompleted, onTime, score]
  );

  return { totalAssigned, totalCompleted, onTime, score };
};
