// Notifications Express Routes
import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.post('/mark-all-read', markAllRead);

export default router;
