// Express Server Bootstrap
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import kpiRoutes from './routes/kpi.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import { pool } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api', (req: Request, res: Response) => {
  res.json({ name: 'TaskFlow API Server', status: 'running' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`?? TaskFlow Express Server running on http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('? PostgreSQL connection verified!');
  } catch (err: any) {
    console.warn('? PostgreSQL connection failed:', err.message);
    console.warn('?? Check DATABASE_URL in server/.env');
  }
});

export default app;

