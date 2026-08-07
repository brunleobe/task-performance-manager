"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getMySummary = exports.getLeaderboard = void 0;
const mssql_1 = __importDefault(require("mssql"));
const db_1 = __importDefault(require("../config/db"));
// GET /api/kpi/leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const period = req.query.period || new Date().toISOString().substring(0, 7);
        const pool = await (0, db_1.default)();
        const result = await pool.request()
            .input('period', mssql_1.default.VarChar, period)
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
    }
    catch (err) {
        console.error('Leaderboard Error:', err);
        return res.status(500).json({ message: 'Failed to retrieve leaderboard' });
    }
};
exports.getLeaderboard = getLeaderboard;
// GET /api/kpi/my-summary
const getMySummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const period = new Date().toISOString().substring(0, 7);
        const pool = await (0, db_1.default)();
        const result = await pool.request()
            .input('userId', mssql_1.default.VarChar, userId)
            .input('period', mssql_1.default.VarChar, period)
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
    }
    catch (err) {
        return res.status(500).json({ message: 'Failed to retrieve KPI summary' });
    }
};
exports.getMySummary = getMySummary;
// GET /api/kpi/export
const exportReport = async (req, res) => {
    try {
        const period = req.query.period || new Date().toISOString().substring(0, 7);
        const pool = await (0, db_1.default)();
        const result = await pool.request()
            .input('period', mssql_1.default.VarChar, period)
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
            ...result.recordset.map((k, i) => [
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
    }
    catch (err) {
        return res.status(500).json({ message: 'Failed to export CSV report' });
    }
};
exports.exportReport = exportReport;
