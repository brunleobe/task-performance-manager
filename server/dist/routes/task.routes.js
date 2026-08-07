"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Task Express Routes Definition
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', task_controller_1.getTasks);
router.post('/', (0, auth_1.requireRole)(['manager', 'admin']), task_controller_1.createTask);
router.patch('/:id/complete', task_controller_1.completeTask);
exports.default = router;
