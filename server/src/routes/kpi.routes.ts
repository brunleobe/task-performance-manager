// KPI Express Routes Definition
import { Router } from 'express';
import { getLeaderboard, getMySummary, exportReport, getTrends } from '../controllers/kpi.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/my-summary', getMySummary);
router.get('/leaderboard', requireRole(['manager', 'admin']), getLeaderboard);
router.get('/export', requireRole(['manager', 'admin']), exportReport);
router.get('/trends', requireRole(['manager', 'admin']), getTrends);

export default router;
