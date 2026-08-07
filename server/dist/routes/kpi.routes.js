"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// KPI Express Routes Definition
const express_1 = require("express");
const kpi_controller_1 = require("../controllers/kpi.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/my-summary', kpi_controller_1.getMySummary);
router.get('/leaderboard', (0, auth_1.requireRole)(['manager', 'admin']), kpi_controller_1.getLeaderboard);
router.get('/export', (0, auth_1.requireRole)(['manager', 'admin']), kpi_controller_1.exportReport);
exports.default = router;
