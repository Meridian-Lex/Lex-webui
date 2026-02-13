// Types derived from pkg/api/stratavore.proto

export type RunnerStatus = 'running' | 'paused' | 'terminated' | 'failed' | 'pending';
export type ConversationMode = 'new' | 'continue' | 'resume';

export interface Runner {
  id: string;
  runtimeType: string;
  runtimeId: string;
  nodeId: string;
  projectName: string;
  projectPath: string;
  status: RunnerStatus;
  flags: string[];
  capabilities: string[];
  environment: Record<string, string>;
  sessionId: string;
  conversationMode: ConversationMode;
  tokensUsed: number;
  cpuPercent: number;
  memoryMb: number;
  restartAttempts: number;
  maxRestartAttempts: number;
  startedAt: string;
  lastHeartbeat: string;
  heartbeatTtlSeconds: number;
  terminatedAt?: string;
  exitCode?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  name: string;
  path: string;
  status: string;
  description: string;
  tags: string[];
  totalRunners: number;
  activeRunners: number;
  totalSessions: number;
  totalTokens: number;
  createdAt: string;
  lastAccessedAt: string;
  archivedAt?: string;
  updatedAt: string;
}

export interface DaemonStatus {
  daemonId: string;
  hostname: string;
  version: string;
  startedAt: string;
  lastHeartbeat: string;
  healthy: boolean;
}

export interface GlobalMetrics {
  activeRunners: number;
  activeProjects: number;
  totalSessions: number;
  tokensUsed: number;
  tokenLimit: number;
}

export interface StatusResponse {
  daemon: DaemonStatus;
  metrics: GlobalMetrics;
  error?: string;
}

export interface LaunchRunnerRequest {
  projectName: string;
  projectPath: string;
  flags?: string[];
  capabilities?: string[];
  environment?: Record<string, string>;
  conversationMode?: ConversationMode;
  sessionId?: string;
  runtimeType?: string;
}

export interface StopRunnerRequest {
  runnerId: string;
  force?: boolean;
  timeoutSeconds?: number;
}

export interface CreateProjectRequest {
  name: string;
  path: string;
  description?: string;
  tags?: string[];
}

export interface ReconcileResponse {
  reconciledCount: number;
  failedRunnerIds: string[];
  error?: string;
}

export interface Session {
  id: string;
  runner_id: string;
  project_name: string;
  started_at: string;
  ended_at?: string;
  last_message_at?: string;
  message_count: number;
  tokens_used: number;
  resumable: boolean;
  resumed_from?: string;
  summary?: string;
  created_at: string;
}
