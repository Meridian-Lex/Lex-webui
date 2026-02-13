import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module before importing service
vi.mock('../api', () => ({
  stratavoreApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('statusApi', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getStatus returns daemon and metrics', async () => {
    const { stratavoreApi } = await import('../api');
    const { statusApi } = await import('../stratavore.service');
    const mockData = {
      daemon: { daemonId: 'd1', healthy: true, hostname: 'h', version: '1', startedAt: '', lastHeartbeat: '' },
      metrics: { activeRunners: 2, activeProjects: 1, totalSessions: 5, tokensUsed: 1000, tokenLimit: 10000 },
    };
    vi.mocked(stratavoreApi.get).mockResolvedValueOnce({ data: mockData } as any);
    const result = await statusApi.getStatus();
    expect(result.daemon.healthy).toBe(true);
    expect(result.metrics.activeRunners).toBe(2);
  });

  it('getHealth returns true on success', async () => {
    const { stratavoreApi } = await import('../api');
    const { statusApi } = await import('../stratavore.service');
    vi.mocked(stratavoreApi.get).mockResolvedValueOnce({ data: 'OK' } as any);
    const result = await statusApi.getHealth();
    expect(result).toBe(true);
  });

  it('getHealth returns false on error', async () => {
    const { stratavoreApi } = await import('../api');
    const { statusApi } = await import('../stratavore.service');
    vi.mocked(stratavoreApi.get).mockRejectedValueOnce(new Error('connection refused'));
    const result = await statusApi.getHealth();
    expect(result).toBe(false);
  });
});

describe('runnerApi', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listRunners calls correct endpoint without project filter', async () => {
    const { stratavoreApi } = await import('../api');
    const { runnerApi } = await import('../stratavore.service');
    vi.mocked(stratavoreApi.get).mockResolvedValueOnce({ data: { runners: [], total: 0 } } as any);
    await runnerApi.listRunners();
    expect(stratavoreApi.get).toHaveBeenCalledWith('/runners/list', { params: {} });
  });

  it('listRunners passes project filter when provided', async () => {
    const { stratavoreApi } = await import('../api');
    const { runnerApi } = await import('../stratavore.service');
    vi.mocked(stratavoreApi.get).mockResolvedValueOnce({ data: { runners: [], total: 0 } } as any);
    await runnerApi.listRunners('my-project');
    expect(stratavoreApi.get).toHaveBeenCalledWith('/runners/list', { params: { project: 'my-project' } });
  });

  it('launchRunner throws on error response', async () => {
    const { stratavoreApi } = await import('../api');
    const { runnerApi } = await import('../stratavore.service');
    vi.mocked(stratavoreApi.post).mockResolvedValueOnce({ data: { runner: null, error: 'quota exceeded' } } as any);
    await expect(runnerApi.launchRunner({ projectName: 'p', projectPath: '/p' }))
      .rejects.toThrow('quota exceeded');
  });
});

describe('projectApi', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('listProjects returns projects array', async () => {
    const { stratavoreApi } = await import('../api');
    const { projectApi } = await import('../stratavore.service');
    const mockProjects = [{ name: 'p1', path: '/p1', status: 'active' }];
    vi.mocked(stratavoreApi.get).mockResolvedValueOnce({ data: { projects: mockProjects } } as any);
    const result = await projectApi.listProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('p1');
  });

  it('listProjects returns empty array when projects is null', async () => {
    const { stratavoreApi } = await import('../api');
    const { projectApi } = await import('../stratavore.service');
    vi.mocked(stratavoreApi.get).mockResolvedValueOnce({ data: { projects: null } } as any);
    const result = await projectApi.listProjects();
    expect(result).toEqual([]);
  });
});
