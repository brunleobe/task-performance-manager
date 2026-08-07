"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Auth Express Routes Definition
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login);
router.get('/me', auth_1.authenticateToken, auth_controller_1.getMe);
exports.default = router;
