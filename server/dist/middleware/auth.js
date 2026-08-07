"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Verifies Bearer JWT Token in request headers
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    const secret = process.env.JWT_SECRET || 'super_secret_taskflow_jwt_key_2026';
    jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// Restricts route access to specific user roles
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthenticated' });
        }
        if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};
exports.requireRole = requireRole;
