// Central TypeScript type definitions for the application

export type UserRole = 'staff' | 'manager' | 'admin';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// Department entity
export interface Department {
  id: string;
  name: string;
  user_count?: number;
  created_at?: string;
}

// User account
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string;
  department_name?: string;
  created_at: string;
}

// Task entity assigned by managers to staff
export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_to_name?: string;
  created_by: string;
  weight_points: 1 | 2 | 3 | 4 | 5;
  status: TaskStatus;
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

// Monthly KPI log for a staff member
export interface KPILog {
  id: string;
  user_id: string;
  user_name?: string;
  period: string;
  total_weight_assigned: number;
  total_weight_completed: number;
  on_time_count: number;
  kpi_score: number;
}

// Auth payload stored in state/context
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string;
  department_name?: string;
}

// Form credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// API auth response
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// Payload for creating a new task
export interface CreateTaskPayload {
  title: string;
  description: string;
  assigned_to: string;
  weight_points: 1 | 2 | 3 | 4 | 5;
  due_date: string;
}

// In-app notification record
export interface Notification {
  id: string;
  user_id: string;
  type: 'assigned' | 'completed' | 'overdue';
  message: string;
  task_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TrendsData {
  periods: string[];
  records: Array<{
    user_id: string;
    user_name: string;
    period: string;
    kpi_score: number;
    total_weight_assigned: number;
    total_weight_completed: number;
    on_time_count: number;
  }>;
  monthlyTotals: Record<string, { assigned: number; completed: number }>;
}

