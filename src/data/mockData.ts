// Mock data for demo mode
import type { Task, User, KPILog, Department } from '../types';

// Demo department list
export const DEMO_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', user_count: 5 },
  { id: 'd2', name: 'Product & Design', user_count: 2 },
  { id: 'd3', name: 'Operations', user_count: 1 },
];

// Demo user accounts
export const DEMO_USERS: User[] = [
  {
    id: 'u0',
    email: 'admin@company.com',
    full_name: 'System Admin',
    role: 'admin',
    department_id: 'd1',
    department_name: 'Engineering',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u1',
    email: 'manager@company.com',
    full_name: 'Rachel Adams',
    role: 'manager',
    department_id: 'd1',
    department_name: 'Engineering',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    email: 'sarah@company.com',
    full_name: 'Sarah Connor',
    role: 'staff',
    department_id: 'd1',
    department_name: 'Engineering',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'u3',
    email: 'alex@company.com',
    full_name: 'Alex Mercer',
    role: 'staff',
    department_id: 'd1',
    department_name: 'Engineering',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: 'u4',
    email: 'james@company.com',
    full_name: 'James Wright',
    role: 'staff',
    department_id: 'd1',
    department_name: 'Engineering',
    created_at: '2026-01-10T00:00:00Z',
  },
];

// Demo login credentials map
export const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@company.com': 'admin123',
  'manager@company.com': 'manager123',
  'sarah@company.com': 'staff123',
  'alex@company.com': 'staff123',
  'james@company.com': 'staff123',
};

// Relative date helpers for realistic deadlines
const now = new Date();
const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
const today = new Date(now);
const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);

const fmt = (d: Date) => d.toISOString();

// Demo tasks
export const DEMO_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Update homepage banner',
    description: 'Refresh the hero section with Q3 marketing assets.',
    assigned_to: 'u2',
    assigned_to_name: 'Sarah Connor',
    created_by: 'u1',
    weight_points: 2,
    status: 'completed',
    due_date: fmt(today),
    completed_at: fmt(yesterday),
    created_at: fmt(lastWeek),
  },
  {
    id: 't2',
    title: 'Refactor API routes',
    description: 'Clean up legacy REST endpoints and add consistent error handling.',
    assigned_to: 'u2',
    assigned_to_name: 'Sarah Connor',
    created_by: 'u1',
    weight_points: 4,
    status: 'in_progress',
    due_date: fmt(tomorrow),
    completed_at: null,
    created_at: fmt(lastWeek),
  },
  {
    id: 't3',
    title: 'Write unit tests for auth module',
    description: 'Achieve 80%+ coverage on the authentication service.',
    assigned_to: 'u2',
    assigned_to_name: 'Sarah Connor',
    created_by: 'u1',
    weight_points: 3,
    status: 'pending',
    due_date: fmt(nextWeek),
    completed_at: null,
    created_at: fmt(today),
  },
  {
    id: 't4',
    title: 'Deploy staging environment',
    description: 'Configure CI/CD pipeline and deploy to Azure staging slot.',
    assigned_to: 'u2',
    assigned_to_name: 'Sarah Connor',
    created_by: 'u1',
    weight_points: 5,
    status: 'overdue',
    due_date: fmt(lastWeek),
    completed_at: null,
    created_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
  },
  {
    id: 't5',
    title: 'Design new onboarding flow',
    description: 'Wireframe and prototype the 3-step user onboarding experience.',
    assigned_to: 'u3',
    assigned_to_name: 'Alex Mercer',
    created_by: 'u1',
    weight_points: 3,
    status: 'completed',
    due_date: fmt(yesterday),
    completed_at: fmt(lastWeek),
    created_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
  },
  {
    id: 't6',
    title: 'SQL Server migration script',
    description: 'Migrate legacy MySQL tables to SQL Server with full data validation.',
    assigned_to: 'u3',
    assigned_to_name: 'Alex Mercer',
    created_by: 'u1',
    weight_points: 5,
    status: 'in_progress',
    due_date: fmt(nextWeek),
    completed_at: null,
    created_at: fmt(today),
  },
  {
    id: 't7',
    title: 'Fix production bug #482',
    description: 'Race condition in the task completion endpoint causes duplicate KPI entries.',
    assigned_to: 'u4',
    assigned_to_name: 'James Wright',
    created_by: 'u1',
    weight_points: 4,
    status: 'pending',
    due_date: fmt(tomorrow),
    completed_at: null,
    created_at: fmt(today),
  },
];

// Pre-computed demo KPI logs
export const DEMO_KPI_LOGS: KPILog[] = [
  {
    id: 'k1',
    user_id: 'u2',
    user_name: 'Sarah Connor',
    period: '2026-08',
    total_weight_assigned: 14,
    total_weight_completed: 11,
    on_time_count: 12,
    kpi_score: 95.2,
  },
  {
    id: 'k2',
    user_id: 'u3',
    user_name: 'Alex Mercer',
    period: '2026-08',
    total_weight_assigned: 12,
    total_weight_completed: 9,
    on_time_count: 9,
    kpi_score: 88.4,
  },
  {
    id: 'k3',
    user_id: 'u4',
    user_name: 'James Wright',
    period: '2026-08',
    total_weight_assigned: 10,
    total_weight_completed: 6,
    on_time_count: 6,
    kpi_score: 72.0,
  },
];
