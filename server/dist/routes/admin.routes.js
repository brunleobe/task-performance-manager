"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Admin Express Routes Definition
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all admin routes: requires JWT token AND admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
// User management endpoints
router.get('/users', admin_controller_1.getAllUsers);
router.post('/users', admin_controller_1.createUser);
// Department management endpoints
router.get('/departments', admin_controller_1.getDepartments);
router.post('/departments', admin_controller_1.createDepartment);
exports.default = router;
