// Frontend HTTP Client Service for TaskFlow Backend with Demo Mode Fallback
import type { Task, KPILog, User, Department, AuthUser, LoginCredentials, CreateTaskPayload, Notification } from '../types';
import { DEMO_USERS, DEMO_DEPARTMENTS, DEMO_TASKS, DEMO_KPI_LOGS } from '../data/mockData';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('tpm_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Real JWTs have exactly 3 dot-separated base64 segments
const isRealJwt = (): boolean => {
  const token = localStorage.getItem('tpm_token') ?? '';
  return token.split('.').length === 3;
};

// In-memory lists for smooth demo mode operation
let demoUsersList = [...DEMO_USERS];
let demoDeptList = [...DEMO_DEPARTMENTS];

// Generic live fetch helper — throws on any HTTP error so callers can decide to fall back
const liveGet = async (path: string) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const api = {
  // Login endpoint call
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: AuthUser }> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  // Fetch tasks — always tries live API when real JWT exists
  getTasks: async (): Promise<Task[]> => {
    if (!isRealJwt()) return DEMO_TASKS;
    try {
      const data = await liveGet('/tasks');
      return data.tasks ?? [];
    } catch (err: any) {
      // Only fall back to demo if server is genuinely unreachable (TypeError = network error)
      if (err instanceof TypeError) return DEMO_TASKS;
      throw err;
    }
  },

  // Manager: create a new task
  createTask: async (payload: CreateTaskPayload): Promise<{ taskId: string }> => {
    if (!isRealJwt()) {
      const newTask: Task = {
        id: `t_${Date.now()}`,
        title: payload.title,
        description: payload.description,
        assigned_to: payload.assigned_to,
        assigned_to_name: DEMO_USERS.find(u => u.id === payload.assigned_to)?.full_name || 'Staff User',
        created_by: 'u1',
        weight_points: payload.weight_points,
        status: 'pending',
        due_date: payload.due_date,
        completed_at: null,
        created_at: new Date().toISOString(),
      };
      DEMO_TASKS.unshift(newTask);
      return { taskId: newTask.id };
    }

    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create task');
    }
    return res.json();
  },

  // Manager: update an existing task
  updateTask: async (id: string, payload: CreateTaskPayload): Promise<void> => {
    if (!isRealJwt()) {
      const idx = DEMO_TASKS.findIndex(t => t.id === id);
      if (idx !== -1) {
        DEMO_TASKS[idx] = {
          ...DEMO_TASKS[idx],
          title: payload.title,
          description: payload.description,
          assigned_to: payload.assigned_to,
          assigned_to_name: DEMO_USERS.find(u => u.id === payload.assigned_to)?.full_name || 'Staff User',
          weight_points: payload.weight_points,
          due_date: payload.due_date,
        };
      }
      return;
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update task');
    }
  },

  // Manager: delete a task
  deleteTask: async (id: string): Promise<void> => {
    if (!isRealJwt()) {
      const idx = DEMO_TASKS.findIndex(t => t.id === id);
      if (idx !== -1) DEMO_TASKS.splice(idx, 1);
      return;
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to delete task');
    }
  },

  // Staff: mark task completed
  completeTask: async (taskId: string): Promise<void> => {
    if (!isRealJwt()) {
      const t = DEMO_TASKS.find(x => x.id === taskId);
      if (t) {
        t.status = 'completed';
        t.completed_at = new Date().toISOString();
      }
      return;
    }

    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark task completed');
  },

  // Silently flags all past-due tasks as overdue (called on dashboard load)
  checkOverdue: async (): Promise<void> => {
    if (!isRealJwt()) return;
    try {
      await fetch(`${API_BASE_URL}/tasks/check-overdue`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Non-critical: silently ignore if this fails
    }
  },

  // Manager: fetch team leaderboard
  getLeaderboard: async (): Promise<KPILog[]> => {
    if (!isRealJwt()) return DEMO_KPI_LOGS;
    try {
      const data = await liveGet('/kpi/leaderboard');
      return data.leaderboard ?? [];
    } catch (err: any) {
      if (err instanceof TypeError) return DEMO_KPI_LOGS;
      throw err;
    }
  },

  // Manager: fetch 6-month KPI trends for Reports page
  getKpiTrends: async () => {
    if (!isRealJwt()) return { periods: [], records: [], monthlyTotals: {} };
    return liveGet('/kpi/trends');
  },

  // Staff: fetch personal KPI summary
  getMySummary: async (): Promise<KPILog> => {
    if (!isRealJwt()) return DEMO_KPI_LOGS[0];
    try {
      const data = await liveGet('/kpi/my-summary');
      return data.summary;
    } catch (err: any) {
      if (err instanceof TypeError) return DEMO_KPI_LOGS[0];
      throw err;
    }
  },

  // Export KPI Report CSV
  exportKpiReportCsv: async (): Promise<void> => {
    let csvData = '';
    const filename = `taskflow_kpi_report_${new Date().toISOString().substring(0, 7)}.csv`;

    if (!isRealJwt()) {
      csvData = 'Staff Name,Period,Total Weight Assigned,Total Weight Completed,On-Time Count,KPI Score (%)\n' +
        DEMO_KPI_LOGS.map(k => `"${k.user_name || 'Staff User'}","${k.period}",${k.total_weight_assigned},${k.total_weight_completed},${k.on_time_count},${k.kpi_score}%`).join('\n');
    } else {
      const res = await fetch(`${API_BASE_URL}/kpi/export-csv`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to download CSV report');
      csvData = await res.text();
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Admin: fetch all users
  getAdminUsers: async (): Promise<User[]> => {
    if (!isRealJwt()) return demoUsersList;
    try {
      const data = await liveGet('/admin/users');
      return data.users ?? [];
    } catch (err: any) {
      if (err instanceof TypeError) return demoUsersList;
      throw err;
    }
  },

  // Admin: create a new user account
  createAdminUser: async (payload: any): Promise<{ userId: string }> => {
    if (!isRealJwt()) {
      const newUser: User = {
        id: `u_${Date.now()}`,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
        department_id: payload.department_id,
        department_name: demoDeptList.find(d => d.id === payload.department_id)?.name || 'Engineering',
        created_at: new Date().toISOString(),
      };
      demoUsersList.unshift(newUser);
      return { userId: newUser.id };
    }

    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create user');
    }
    return res.json();
  },

  // Admin: fetch all departments
  getAdminDepartments: async (): Promise<Department[]> => {
    if (!isRealJwt()) return demoDeptList;
    try {
      const data = await liveGet('/admin/departments');
      return data.departments ?? [];
    } catch (err: any) {
      if (err instanceof TypeError) return demoDeptList;
      throw err;
    }
  },

  // Admin: create a new department
  createAdminDepartment: async (name: string): Promise<{ deptId: string }> => {
    if (!isRealJwt()) {
      const newDept: Department = {
        id: `d_${Date.now()}`,
        name,
        user_count: 0,
      };
      demoDeptList.push(newDept);
      return { deptId: newDept.id };
    }

    const res = await fetch(`${API_BASE_URL}/admin/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create department');
    }
    return res.json();
  },

  // Fetch all notifications for the logged-in user
  getNotifications: async (): Promise<Notification[]> => {
    if (!isRealJwt()) return [];
    try {
      const data = await liveGet('/notifications');
      return data.notifications ?? [];
    } catch {
      return [];
    }
  },

  // Mark a single notification as read
  markNotificationRead: async (id: string): Promise<void> => {
    if (!isRealJwt()) return;
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }).catch(() => {});
  },

  // Mark all notifications as read
  markAllNotificationsRead: async (): Promise<void> => {
    if (!isRealJwt()) return;
    await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {});
  },

  // Update user profile full_name
  updateProfile: async (full_name: string): Promise<{ full_name: string }> => {
    if (!isRealJwt()) {
      return { full_name };
    }
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ full_name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update profile');
    }
    return res.json();
  },

  // Change user password
  changePassword: async (current_password: string, new_password: string): Promise<void> => {
    if (!isRealJwt()) {
      return;
    }
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ current_password, new_password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to change password');
    }
  },

  // Helper aliases
  getMyTasks: async (): Promise<Task[]> => api.getTasks(),
  getTeamKpi: async (): Promise<KPILog[]> => api.getLeaderboard(),
  getStaffMembers: async (): Promise<User[]> => {
    const users = await api.getAdminUsers();
    return users.filter(u => u.role === 'staff');
  },
  exportReportCSV: async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/kpi/export`, {
      headers: getAuthHeaders(),
    });
  },
};
