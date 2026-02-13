export interface User {
  id: string;
  username: string;
  role: string;
  lastLogin: string | null;
}

export interface LexStatus {
  mode: 'IDLE' | 'AUTONOMOUS' | 'DIRECTED' | 'COLLABORATIVE';
  currentProject: string | null;
  tokenBudget: {
    dailyLimit: number;
    used: number;
    remaining: number;
    reserved: number;
    weekUsage?: number;
    monthUsage?: number;
    perSessionTarget?: number;
  };
  lastUpdated: string;
}

export interface Project {
  name: string;
  path: string;
  status: string;
  lastActivity: string | null;
  relationships: string[];
  description?: string;
  tags?: string[];
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, unknown>;
}
