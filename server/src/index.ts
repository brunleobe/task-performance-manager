// Express Server Bootstrap with Admin Routes
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import kpiRoutes from './routes/kpi.routes';
import adminRoutes from './routes/admin.routes';
import getPool from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/admin', adminRoutes);

// Root API Endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'TaskFlow API Server',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login',
      tasks: 'GET /api/tasks',
      kpi: 'GET /api/kpi/leaderboard',
      admin: 'GET /api/admin/users',
    },
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`🚀 TaskFlow Express Server running on http://localhost:${PORT}`);
  try {
    await getPool();
  } catch (err) {
    console.warn('⚠️ Server running, but SQL Server connection failed. Verify credentials in .env');
  }
});

export default app;
