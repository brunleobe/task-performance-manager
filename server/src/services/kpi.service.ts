// Server-side KPI Recalculation Service
import getPool from '../config/db';
import mssql from 'mssql';

// Recalculates user KPI score and updates KPILogs table
export const recalculateUserKPI = async (userId: string, period: string) => {
  const pool = await getPool();

  const statsResult = await pool.request()
    .input('userId', mssql.VarChar, userId)
    .input('periodPrefix', mssql.VarChar, `${period}%`)
    .query(`
      SELECT
        ISNULL(SUM(weight_points), 0) AS total_assigned_weight,
        ISNULL(SUM(CASE WHEN status = 'completed' THEN weight_points ELSE 0 END), 0) AS total_completed_weight,
        ISNULL(SUM(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 ELSE 0 END), 0) AS on_time_count,
        ISNULL(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS total_completed_count
      FROM Tasks
      WHERE assigned_to = @userId
        AND FORMAT(created_at, 'yyyy-MM') = @periodPrefix
    `);

  const stats = statsResult.recordset[0];
  const totalAssigned = stats.total_assigned_weight;
  const totalCompleted = stats.total_completed_weight;
  const onTime = stats.on_time_count;
  const totalCompletedCount = stats.total_completed_count;

  let score = 0;
  if (totalAssigned > 0 && totalCompletedCount > 0) {
    const completionRate = (totalCompleted / totalAssigned) * 0.4;
    const timelinessRate = (onTime / totalCompletedCount) * 0.6;
    score = (completionRate + timelinessRate) * 100;
  }

  score = Math.min(100, Math.round(score * 10) / 10);

  await pool.request()
    .input('id', mssql.VarChar, `k_${userId}_${period}`)
    .input('userId', mssql.VarChar, userId)
    .input('period', mssql.VarChar, period)
    .input('assigned', mssql.Int, totalAssigned)
    .input('completed', mssql.Int, totalCompleted)
    .input('onTime', mssql.Int, onTime)
    .input('score', mssql.Decimal(5, 2), score)
    .query(`
      MERGE KPILogs AS target
      USING (SELECT @userId AS user_id, @period AS period) AS source
      ON (target.user_id = source.user_id AND target.period = source.period)
      WHEN MATCHED THEN
        UPDATE SET
          total_weight_assigned = @assigned,
          total_weight_completed = @completed,
          on_time_count = @onTime,
          kpi_score = @score,
          updated_at = GETUTCDATE()
      WHEN NOT MATCHED THEN
        INSERT (id, user_id, period, total_weight_assigned, total_weight_completed, on_time_count, kpi_score)
        VALUES (@id, @userId, @period, @assigned, @completed, @onTime, @score);
    `);

  return { totalAssigned, totalCompleted, onTime, score };
};
