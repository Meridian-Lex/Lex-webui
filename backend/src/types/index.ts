export interface LexStatus {
  mode: 'IDLE' | 'AUTONOMOUS' | 'DIRECTED' | 'COLLABORATIVE';
  currentProject: string | null;
  tokenBudget: {
    dailyLimit: number;
    used: number;
    remaining: number;
    reserved: number;
  };
  lastUpdated: Date;
}

export interface Project {
  name: string;
  path: string;
  status: string;
  lastActivity: Date | null;
  relationships: string[];
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, unknown>;
}

export interface UserResponse {
  id: string;
  username: string;
  role: string;
  lastLogin: Date | null;
}
