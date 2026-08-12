// Admin Express Routes Definition
import { Router } from 'express';
import { getAllUsers, createUser, getDepartments, createDepartment } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin routes with authentication
router.use(authenticateToken);

// User management endpoints
router.get('/users', requireRole(['admin', 'manager']), getAllUsers);
router.post('/users', requireRole(['admin']), createUser);

// Department management endpoints
router.get('/departments', requireRole(['admin', 'manager']), getDepartments);
router.post('/departments', requireRole(['admin']), createDepartment);

export default router;
