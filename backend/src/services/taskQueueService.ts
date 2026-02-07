import { LexFileSystem } from './lexFileSystem';

interface Task {
  id: string;
  subject: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deleted';
  priority?: string;
  assigned?: string;
  complexity?: string;
  metadata?: Record<string, unknown>;
}

export class TaskQueueService {
  private readonly fs: LexFileSystem;

  constructor() {
    this.fs = new LexFileSystem();
  }

  async getAllTasks(filters?: {
    status?: string;
    limit?: number;
  }): Promise<Task[]> {
    try {
      const content = await this.fs.readFile('lex-internal/state/TASK-QUEUE.md');
      const tasks = this.parseTaskQueue(content);

      let filtered = tasks;

      if (filters?.status) {
        filtered = filtered.filter((t) => t.status === filters.status);
      }

      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit);
      }

      return filtered;
    } catch (error) {
      console.error('Failed to read TASK-QUEUE.md:', error);
      return [];
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.getAllTasks();
    return tasks.find((t) => t.id === id) || null;
  }

  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const tasks = await this.getAllTasks();

    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }

  private parseTaskQueue(content: string): Task[] {
    const tasks: Task[] = [];
    const lines = content.split('\n');

    let currentTask: Partial<Task> | null = null;
    let collectingDescription = false;
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Match task header: ### Task 1: Title
      const taskHeaderMatch = trimmed.match(/^###\s+Task\s+(\d+):\s+(.+)$/);
      if (taskHeaderMatch) {
        // Save previous task if exists
        if (currentTask) {
          currentTask.description = descriptionLines.join('\n').trim();
          tasks.push(currentTask as Task);
        }

        // Start new task
        const [, taskNum, title] = taskHeaderMatch;
        currentTask = {
          id: taskNum,
          subject: title,
          description: '',
          status: 'pending',
          metadata: {},
        };
        collectingDescription = false;
        descriptionLines = [];
        continue;
      }

      // If we have a current task, parse its fields
      if (currentTask) {
        // Parse Priority
        const priorityMatch = trimmed.match(/^\*\*Priority\*\*:\s*(?:🔴|🟠|🟡|🟢)?\s*(.+)$/);
        if (priorityMatch) {
          currentTask.priority = priorityMatch[1].trim();
          continue;
        }

        // Parse Status
        const statusMatch = trimmed.match(/^\*\*Status\*\*:\s*(?:⏸️|🔄|⏳|✅|❌)?\s*(.+)$/);
        if (statusMatch) {
          const statusText = statusMatch[1].trim().toUpperCase();
          if (statusText === 'COMPLETE') {
            currentTask.status = 'completed';
          } else if (statusText === 'IN PROGRESS') {
            currentTask.status = 'in_progress';
          } else if (statusText === 'QUEUED') {
            currentTask.status = 'pending';
          } else if (statusText === 'BLOCKED') {
            currentTask.status = 'pending';
            currentTask.metadata = { ...currentTask.metadata, blocked: true };
          } else if (statusText === 'CANCELLED') {
            currentTask.status = 'deleted';
          }
          continue;
        }

        // Parse Assigned
        const assignedMatch = trimmed.match(/^\*\*Assigned\*\*:\s*(.+)$/);
        if (assignedMatch) {
          currentTask.assigned = assignedMatch[1].trim();
          continue;
        }

        // Parse Complexity
        const complexityMatch = trimmed.match(/^\*\*Complexity\*\*:\s*(.+)$/);
        if (complexityMatch) {
          currentTask.complexity = complexityMatch[1].trim();
          continue;
        }

        // Parse Objective (start of description)
        const objectiveMatch = trimmed.match(/^\*\*Objective\*\*:\s*(.+)$/);
        if (objectiveMatch) {
          descriptionLines.push(objectiveMatch[1]);
          collectingDescription = true;
          continue;
        }

        // Task separator (---) or next task means end of current task
        if (trimmed === '---' || trimmed.startsWith('### Task')) {
          if (currentTask) {
            currentTask.description = descriptionLines.join('\n').trim();
            tasks.push(currentTask as Task);
            currentTask = null;
            collectingDescription = false;
            descriptionLines = [];
          }
          continue;
        }

        // Collect description lines
        if (collectingDescription && trimmed && !trimmed.startsWith('**')) {
          descriptionLines.push(trimmed);
        }
      }
    }

    // Don't forget the last task
    if (currentTask) {
      currentTask.description = descriptionLines.join('\n').trim();
      tasks.push(currentTask as Task);
    }

    return tasks;
  }
}
