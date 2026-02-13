import { stratavoreApi } from './api';
import type {
  Runner,
  Project,
  Session,
  GlobalMetrics,
  StatusResponse,
  LaunchRunnerRequest,
  StopRunnerRequest,
  CreateProjectRequest,
  ReconcileResponse,
} from '../types/stratavore';

// Status and health

export const statusApi = {
  async getStatus(): Promise<StatusResponse> {
    const r = await stratavoreApi.get<StatusResponse>('/status');
    return r.data;
  },

  async getHealth(): Promise<boolean> {
    try {
      await stratavoreApi.get('/health');
      return true;
    } catch {
      return false;
    }
  },

  async triggerReconcile(): Promise<ReconcileResponse> {
    const r = await stratavoreApi.post<ReconcileResponse>('/reconcile');
    return r.data;
  },
};

// Runners

export const runnerApi = {
  async listRunners(projectName?: string): Promise<{ runners: Runner[]; total: number }> {
    const params: Record<string, string> = {};
    if (projectName) params.project = projectName;
    const r = await stratavoreApi.get<{ runners: Runner[]; total: number }>('/runners/list', { params });
    return r.data;
  },

  async getRunner(runnerId: string): Promise<Runner> {
    const r = await stratavoreApi.get<{ runner: Runner }>('/runners/get', {
      params: { id: runnerId },
    });
    return r.data.runner;
  },

  async launchRunner(req: LaunchRunnerRequest): Promise<Runner> {
    const r = await stratavoreApi.post<{ runner: Runner; error?: string }>('/runners/launch', req);
    if (r.data.error) throw new Error(r.data.error);
    return r.data.runner;
  },

  async stopRunner(req: StopRunnerRequest): Promise<void> {
    const r = await stratavoreApi.post<{ success: boolean; error?: string }>('/runners/stop', req);
    if (!r.data.success && r.data.error) throw new Error(r.data.error);
  },
};

// Projects

export const projectApi = {
  async listProjects(status?: string): Promise<Project[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const r = await stratavoreApi.get<{ projects: Project[] }>('/projects/list', { params });
    return r.data.projects ?? [];
  },

  async createProject(req: CreateProjectRequest): Promise<Project> {
    const r = await stratavoreApi.post<{ project: Project; error?: string }>('/projects/create', req);
    if (r.data.error) throw new Error(r.data.error);
    return r.data.project;
  },

  async getProject(name: string): Promise<Project> {
    const r = await stratavoreApi.get<{ project: Project; error?: string }>(
      `/projects/get?name=${encodeURIComponent(name)}`
    );
    if (r.data.error) throw new Error(r.data.error);
    return r.data.project;
  },

  async deleteProject(name: string): Promise<void> {
    const r = await stratavoreApi.post<{ success: boolean; error?: string }>('/projects/delete', { name });
    if (!r.data.success && r.data.error) throw new Error(r.data.error);
  },
};

// Sessions

export const sessionApi = {
  async listSessions(project: string): Promise<Session[]> {
    const r = await stratavoreApi.get<{ sessions: Session[]; error?: string }>(
      `/sessions/list?project=${encodeURIComponent(project)}`
    );
    if (r.data.error) throw new Error(r.data.error);
    return r.data.sessions ?? [];
  },

  async getSession(sessionId: string): Promise<Session> {
    const r = await stratavoreApi.get<{ session: Session; error?: string }>(
      `/sessions/get?session_id=${encodeURIComponent(sessionId)}`
    );
    if (r.data.error) throw new Error(r.data.error);
    return r.data.session;
  },
};

// Metrics

export const metricsApi = {
  async getMetrics(): Promise<GlobalMetrics> {
    const r = await stratavoreApi.get<{
      active_runners: number;
      active_projects: number;
      total_sessions: number;
      tokens_used: number;
      token_limit: number;
    }>('/metrics');
    const d = r.data;
    return {
      activeRunners: d.active_runners,
      activeProjects: d.active_projects,
      totalSessions: d.total_sessions,
      tokensUsed: d.tokens_used,
      tokenLimit: d.token_limit,
    };
  },
};
