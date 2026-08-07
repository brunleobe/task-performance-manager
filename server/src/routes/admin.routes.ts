// Admin Express Routes Definition
import { Router } from 'express';
import { getAllUsers, createUser, getDepartments, createDepartment } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin routes: requires JWT token AND admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// User management endpoints
router.get('/users', getAllUsers);
router.post('/users', createUser);

// Department management endpoints
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);

export default router;
