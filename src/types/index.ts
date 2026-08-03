export type UserRole = 'staff' | 'manager' | 'admin';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string;
  department_name?: string;
  created_at: string;
}

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

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  assigned_to: string;
  weight_points: 1 | 2 | 3 | 4 | 5;
  due_date: string;
}
