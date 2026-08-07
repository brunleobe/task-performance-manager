// Task Express Routes Definition
import { Router } from 'express';
import { getTasks, createTask, completeTask } from '../controllers/task.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getTasks);
router.post('/', requireRole(['manager', 'admin']), createTask);
router.patch('/:id/complete', completeTask);

export default router;
