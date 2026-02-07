import api from './api';

export interface Task {
  id: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deleted';
  priority?: string;
  assigned?: string;
  complexity?: string;
  activeForm?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export const taskApi = {
  async getAllTasks(filters?: { status?: string; limit?: number }): Promise<{ tasks: Task[] }> {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async getTaskStats(): Promise<TaskStats> {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  async createTask(data: {
    subject: string;
    description: string;
    activeForm?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(
    id: string,
    updates: {
      status?: 'pending' | 'in_progress' | 'completed';
      subject?: string;
      description?: string;
      activeForm?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, updates);
    return response.data;
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};
