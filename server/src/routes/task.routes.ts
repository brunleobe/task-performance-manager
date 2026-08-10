// Task Express Routes Definition
import { Router } from 'express';
import { getTasks, createTask, completeTask, checkOverdue } from '../controllers/task.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getTasks);
router.post('/', requireRole(['manager', 'admin']), createTask);
router.patch('/:id/complete', completeTask);
router.post('/check-overdue', requireRole(['manager', 'admin']), checkOverdue);

export default router;
