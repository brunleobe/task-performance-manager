// Auth & Role Middleware for JWT Verification and Route Protection
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to attach decoded user payload
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'staff' | 'manager' | 'admin';
    department_id: string;
  };
}

// Verifies Bearer JWT Token in request headers
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'super_secret_taskflow_jwt_key_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded as AuthRequest['user'];
    next();
  });
};

// Restricts route access to specific user roles
export const requireRole = (allowedRoles: ('staff' | 'manager' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
};
