import * as fs from 'fs/promises';
import * as path from 'path';

export interface Task {
  id: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deleted';
  activeForm?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface TaskStorage {
  tasks: Task[];
  nextId: number;
}

const MERIDIAN_HOME = process.env.MERIDIAN_HOME || '/home/meridian/meridian-home';
const TASK_FILE = path.join(MERIDIAN_HOME, '.lex-tasks.json');

export class TaskService {
  private async readTasks(): Promise<TaskStorage> {
    try {
      const content = await fs.readFile(TASK_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // File doesn't exist, return empty storage
      return { tasks: [], nextId: 1 };
    }
  }

  private async writeTasks(storage: TaskStorage): Promise<void> {
    await fs.writeFile(TASK_FILE, JSON.stringify(storage, null, 2), 'utf-8');
  }

  async getAllTasks(filters?: {
    status?: string;
    limit?: number;
  }): Promise<Task[]> {
    const storage = await this.readTasks();
    let tasks = storage.tasks.filter((t) => t.status !== 'deleted');

    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    if (filters?.limit) {
      tasks = tasks.slice(0, filters.limit);
    }

    return tasks;
  }

  async getTaskById(id: string): Promise<Task | null> {
    const storage = await this.readTasks();
    const task = storage.tasks.find((t) => t.id === id && t.status !== 'deleted');
    return task || null;
  }

  async createTask(data: {
    subject: string;
    description: string;
    activeForm?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Task> {
    const storage = await this.readTasks();
    const now = new Date().toISOString();

    const task: Task = {
      id: storage.nextId.toString(),
      subject: data.subject,
      description: data.description,
      status: 'pending',
      activeForm: data.activeForm,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
    };

    storage.tasks.push(task);
    storage.nextId += 1;

    await this.writeTasks(storage);
    return task;
  }

  async updateTask(
    id: string,
    updates: {
      status?: 'pending' | 'in_progress' | 'completed' | 'deleted';
      subject?: string;
      description?: string;
      activeForm?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Task | null> {
    const storage = await this.readTasks();
    const taskIndex = storage.tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return null;
    }

    const task = storage.tasks[taskIndex];
    const now = new Date().toISOString();

    storage.tasks[taskIndex] = {
      ...task,
      ...updates,
      updatedAt: now,
    };

    await this.writeTasks(storage);
    return storage.tasks[taskIndex];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.updateTask(id, { status: 'deleted' });
    return result !== null;
  }

  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const storage = await this.readTasks();
    const activeTasks = storage.tasks.filter((t) => t.status !== 'deleted');

    return {
      total: activeTasks.length,
      pending: activeTasks.filter((t) => t.status === 'pending').length,
      inProgress: activeTasks.filter((t) => t.status === 'in_progress').length,
      completed: activeTasks.filter((t) => t.status === 'completed').length,
    };
  }
}
