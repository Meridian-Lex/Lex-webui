import { stratavoreApi } from './api';
import type {
  Runner,
  Project,
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
};
