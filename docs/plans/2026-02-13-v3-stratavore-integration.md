# Lex-webui v3 Stratavore Integration Implementation Plan

> **For Lex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Lex-webui v1 Node.js backend with direct integration against the Stratavore HTTP API, making the webui the browser-based control plane for Stratavore's runner, project, and daemon management.

**Architecture:** The Node.js backend is deleted. nginx serves the React SPA and proxies `/api/v1/*` directly to the Stratavore daemon. The frontend gains new TypeScript types (from proto), a new API service layer, and three new pages (Dashboard, Runners, Projects). Five v1 pages that depend on local-filesystem data (Tasks, Logs, Config, ProjectGraph) are removed.

**Tech Stack:** React 18, TypeScript, Vite, Ant Design 5, Axios, Recharts — no stack change. nginx reverse proxy. Stratavore Go daemon (port 8080).

**Branch:** `feature/v3-stratavore-integration` in Lex-webui repo.
**Working dir for all commands:** `/home/meridian/meridian-home/projects/Lex-webui/frontend`

---

## Phase 1 — Core Control Plane (all 9 webui-relevant HTTP endpoints)

---

### Task 1: Stratavore TypeScript Types

**Files:**
- Create: `frontend/src/types/stratavore.ts`
- Modify: `frontend/src/types/index.ts`

**Step 1: Create `frontend/src/types/stratavore.ts`**

```typescript
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
```

**Step 2: Update `frontend/src/types/index.ts`**

Replace entire content with:

```typescript
// v3: Stratavore types — source of truth for all operational data
export * from './stratavore';

// Legacy User type kept for auth context (simplified in v3)
export interface User {
  id: string;
  username: string;
  role: string;
  lastLogin: string | null;
}
```

**Step 3: Verify TypeScript compiles**

```bash
npm run type-check
```

Expected: no errors (no code uses old types yet, just type definitions).

**Step 4: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/src/types/
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(types): add Stratavore v3 TypeScript types from proto"
```

---

### Task 2: Stratavore API Service Layer

**Files:**
- Create: `frontend/src/services/stratavore.service.ts`
- Modify: `frontend/src/services/api.ts`

**Step 1: Update `frontend/src/services/api.ts` — add Stratavore axios instance**

Replace entire content with:

```typescript
import axios from 'axios';

// v3: Stratavore HTTP API client
// Base URL is /api/v1 — nginx proxies this to the Stratavore daemon
export const stratavoreApi = axios.create({
  baseURL: import.meta.env.VITE_STRATAVORE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

stratavoreApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[stratavore]', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// Legacy api instance — kept temporarily while old pages are removed
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
```

**Step 2: Create `frontend/src/services/stratavore.service.ts`**

```typescript
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
```

**Step 3: Write service unit tests**

Create `frontend/src/services/__tests__/stratavore.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stratavoreApi } from '../api';

vi.mock('../api', () => ({
  stratavoreApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockGet = vi.mocked(stratavoreApi.get);
const mockPost = vi.mocked(stratavoreApi.post);

describe('statusApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getStatus returns daemon and metrics', async () => {
    const { statusApi } = await import('../stratavore.service');
    const mockData = {
      daemon: { daemonId: 'd1', healthy: true, hostname: 'h', version: '1', startedAt: '', lastHeartbeat: '' },
      metrics: { activeRunners: 2, activeProjects: 1, totalSessions: 5, tokensUsed: 1000, tokenLimit: 10000 },
    };
    mockGet.mockResolvedValueOnce({ data: mockData } as any);
    const result = await statusApi.getStatus();
    expect(result.daemon.healthy).toBe(true);
    expect(result.metrics.activeRunners).toBe(2);
  });
});

describe('runnerApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listRunners calls correct endpoint', async () => {
    const { runnerApi } = await import('../stratavore.service');
    mockGet.mockResolvedValueOnce({ data: { runners: [], total: 0 } } as any);
    await runnerApi.listRunners();
    expect(mockGet).toHaveBeenCalledWith('/runners/list', { params: {} });
  });

  it('launchRunner throws on error response', async () => {
    const { runnerApi } = await import('../stratavore.service');
    mockPost.mockResolvedValueOnce({ data: { runner: null, error: 'quota exceeded' } } as any);
    await expect(runnerApi.launchRunner({ projectName: 'p', projectPath: '/p' }))
      .rejects.toThrow('quota exceeded');
  });
});
```

**Step 4: Run tests**

```bash
npm run test -- src/services/__tests__/stratavore.service.test.ts
```

Expected: 3 tests pass.

**Step 5: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/src/services/
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(services): add Stratavore v3 API service layer with unit tests"
```

---

### Task 3: Dashboard Page Rewrite

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`

**Step 1: Rewrite `DashboardPage.tsx`**

Replace entire content with:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Card, Row, Col, Typography, Tag, Alert,
  Skeleton, Statistic, Button, Space, Tooltip,
} from 'antd';
import {
  CheckCircleOutlined, WarningOutlined, SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { statusApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { StatusResponse } from '../types/stratavore';

const { Content } = Layout;
const { Title, Text } = Typography;

const POLL_INTERVAL_MS = 5000;

export default function DashboardPage(): React.ReactElement {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const data = await statusApi.getStatus();
      setStatus(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Cannot reach Stratavore daemon. Check that stratavored is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleReconcile() {
    setReconciling(true);
    try {
      const result = await statusApi.triggerReconcile();
      await fetchStatus();
      if (result.failedRunnerIds?.length) {
        setError(`Reconciliation found ${result.failedRunnerIds.length} failed runner(s).`);
      }
    } catch {
      setError('Reconciliation failed.');
    } finally {
      setReconciling(false);
    }
  }

  const tokenPct = status
    ? status.metrics.tokenLimit > 0
      ? (status.metrics.tokensUsed / status.metrics.tokenLimit) * 100
      : 0
    : 0;

  const tokenColor = tokenPct > 90 ? '#ff4d4f' : tokenPct > 70 ? '#faad14' : '#52c41a';

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message="Connection Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Daemon Health */}
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Stratavore Control Plane</Title>
          </Col>
          <Col>
            {loading && !status ? (
              <Skeleton.Button active size="small" />
            ) : (
              <Tag
                icon={status?.daemon.healthy ? <CheckCircleOutlined /> : <WarningOutlined />}
                color={status?.daemon.healthy ? 'success' : 'error'}
              >
                {status?.daemon.healthy ? 'HEALTHY' : 'UNHEALTHY'}
              </Tag>
            )}
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {status ? `v${status.daemon.version} — ${status.daemon.hostname}` : ''}
            </Text>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              <Tooltip title="Trigger reconciliation — cleans up stale runners">
                <Button
                  icon={<SyncOutlined spin={reconciling} />}
                  onClick={handleReconcile}
                  loading={reconciling}
                  size="small"
                >
                  Reconcile
                </Button>
              </Tooltip>
              <Tooltip title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}>
                <Button icon={<ReloadOutlined />} onClick={fetchStatus} size="small" />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {/* Global Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Active Runners"
                  value={status?.metrics.activeRunners ?? 0}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Active Projects"
                  value={status?.metrics.activeProjects ?? 0}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Total Sessions"
                  value={status?.metrics.totalSessions ?? 0}
                />
              )}
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              {loading && !status ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Statistic
                  title="Tokens Used"
                  value={status?.metrics.tokensUsed ?? 0}
                  suffix={status?.metrics.tokenLimit ? `/ ${status.metrics.tokenLimit.toLocaleString()}` : ''}
                  valueStyle={{ color: tokenColor }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
```

**Step 2: Verify TypeScript**

```bash
npm run type-check
```

Expected: no new errors.

**Step 3: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/src/pages/DashboardPage.tsx
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(ui): rewrite Dashboard to consume Stratavore status API"
```

---

### Task 4: Runners Page (New)

**Files:**
- Create: `frontend/src/pages/RunnersPage.tsx`

**Step 1: Create `frontend/src/pages/RunnersPage.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Table, Tag, Button, Space, Typography,
  Modal, Form, Input, Select, Alert, Tooltip, Badge,
} from 'antd';
import {
  PlusOutlined, StopOutlined, ReloadOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { runnerApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { Runner, LaunchRunnerRequest } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  running: 'success',
  paused: 'warning',
  terminated: 'default',
  failed: 'error',
  pending: 'processing',
};

export default function RunnersPage(): React.ReactElement {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchVisible, setLaunchVisible] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [form] = Form.useForm<LaunchRunnerRequest>();

  const fetchRunners = useCallback(async () => {
    try {
      const data = await runnerApi.listRunners();
      setRunners(data.runners ?? []);
      setError(null);
    } catch {
      setError('Failed to load runners from Stratavore daemon.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRunners();
    const interval = setInterval(fetchRunners, 5000);
    return () => clearInterval(interval);
  }, [fetchRunners]);

  async function handleStop(runnerId: string, force = false) {
    setStoppingId(runnerId);
    try {
      await runnerApi.stopRunner({ runnerId, force });
      await fetchRunners();
    } catch (err) {
      setError(`Failed to stop runner ${runnerId}.`);
    } finally {
      setStoppingId(null);
    }
  }

  async function handleLaunch(values: LaunchRunnerRequest) {
    setLaunching(true);
    try {
      await runnerApi.launchRunner(values);
      setLaunchVisible(false);
      form.resetFields();
      await fetchRunners();
    } catch (err: any) {
      setError(err.message ?? 'Failed to launch runner.');
    } finally {
      setLaunching(false);
    }
  }

  const columns: ColumnsType<Runner> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <code style={{ fontSize: 11 }}>{id.slice(0, 12)}...</code>
        </Tooltip>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'running' ? 'processing' : status === 'failed' ? 'error' : 'default'}
          text={<Tag color={STATUS_COLOR[status] ?? 'default'}>{status.toUpperCase()}</Tag>}
        />
      ),
      filters: ['running', 'paused', 'terminated', 'failed'].map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Mode',
      dataIndex: 'conversationMode',
      width: 100,
    },
    {
      title: 'Tokens',
      dataIndex: 'tokensUsed',
      render: (n: number) => n?.toLocaleString() ?? '—',
      sorter: (a, b) => a.tokensUsed - b.tokensUsed,
    },
    {
      title: 'CPU',
      dataIndex: 'cpuPercent',
      render: (n: number) => n ? `${n.toFixed(1)}%` : '—',
      width: 80,
    },
    {
      title: 'Memory',
      dataIndex: 'memoryMb',
      render: (n: number) => n ? `${n}M` : '—',
      width: 90,
    },
    {
      title: 'Restarts',
      dataIndex: 'restartAttempts',
      width: 80,
      render: (n: number) =>
        n > 0 ? (
          <Tag icon={<WarningOutlined />} color="warning">{n}</Tag>
        ) : (
          <span>0</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Runner) => (
        <Space size="small">
          {record.status === 'running' || record.status === 'paused' ? (
            <>
              <Button
                size="small"
                icon={<StopOutlined />}
                loading={stoppingId === record.id}
                onClick={() => handleStop(record.id)}
              >
                Stop
              </Button>
              <Tooltip title="Force kill (SIGKILL)">
                <Button
                  size="small"
                  danger
                  onClick={() => handleStop(record.id, true)}
                  loading={stoppingId === record.id}
                >
                  Kill
                </Button>
              </Tooltip>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ marginBottom: 16 }} align="center">
          <Title level={4} style={{ margin: 0 }}>Runners</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setLaunchVisible(true)}
          >
            Launch Runner
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchRunners} />
        </Space>

        <Table<Runner>
          dataSource={runners}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />

        <Modal
          title="Launch Runner"
          open={launchVisible}
          onCancel={() => { setLaunchVisible(false); form.resetFields(); }}
          onOk={() => form.submit()}
          confirmLoading={launching}
          okText="Launch"
        >
          <Form form={form} layout="vertical" onFinish={handleLaunch}>
            <Form.Item
              name="projectName"
              label="Project Name"
              rules={[{ required: true, message: 'Project name is required' }]}
            >
              <Input placeholder="my-project" />
            </Form.Item>
            <Form.Item
              name="projectPath"
              label="Project Path"
              rules={[{ required: true, message: 'Project path is required' }]}
            >
              <Input placeholder="/home/meridian/meridian-home/projects/my-project" />
            </Form.Item>
            <Form.Item name="conversationMode" label="Conversation Mode" initialValue="new">
              <Select>
                <Select.Option value="new">New</Select.Option>
                <Select.Option value="continue">Continue</Select.Option>
                <Select.Option value="resume">Resume</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
```

**Step 2: Type check**

```bash
npm run type-check
```

Expected: clean.

**Step 3: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/src/pages/RunnersPage.tsx
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(ui): add Runners page with launch, stop, kill actions"
```

---

### Task 5: Projects Page Rewrite

**Files:**
- Modify: `frontend/src/pages/ProjectsPage.tsx`

**Step 1: Rewrite `frontend/src/pages/ProjectsPage.tsx`**

Replace entire content with:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Table, Button, Space, Typography,
  Modal, Form, Input, Alert, Tag,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { projectApi } from '../services/stratavore.service';
import { AppHeader } from '../components/AppHeader';
import type { Project, CreateProjectRequest } from '../types/stratavore';

const { Content } = Layout;
const { Title } = Typography;

export default function ProjectsPage(): React.ReactElement {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<CreateProjectRequest>();

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectApi.listProjects();
      setProjects(data);
      setError(null);
    } catch {
      setError('Failed to load projects from Stratavore daemon.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(values: CreateProjectRequest) {
    setCreating(true);
    try {
      await projectApi.createProject(values);
      setCreateVisible(false);
      form.resetFields();
      await fetchProjects();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  }

  const columns: ColumnsType<Project> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : status === 'archived' ? 'default' : 'processing'}>
          {status?.toUpperCase() ?? 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Active Runners',
      dataIndex: 'activeRunners',
      sorter: (a, b) => a.activeRunners - b.activeRunners,
    },
    {
      title: 'Total Sessions',
      dataIndex: 'totalSessions',
      sorter: (a, b) => a.totalSessions - b.totalSessions,
    },
    {
      title: 'Total Tokens',
      dataIndex: 'totalTokens',
      render: (n: number) => n?.toLocaleString() ?? '0',
      sorter: (a, b) => a.totalTokens - b.totalTokens,
    },
    {
      title: 'Last Accessed',
      dataIndex: 'lastAccessedAt',
      render: (ts: string) => ts ? new Date(ts).toLocaleString() : '—',
      sorter: (a, b) =>
        new Date(a.lastAccessedAt || 0).getTime() - new Date(b.lastAccessedAt || 0).getTime(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
    },
  ];

  return (
    <Layout>
      <AppHeader />
      <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ marginBottom: 16 }} align="center">
          <Title level={4} style={{ margin: 0 }}>Projects</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            New Project
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects} />
        </Space>

        <Table<Project>
          dataSource={projects}
          columns={columns}
          rowKey="name"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />

        <Modal
          title="Create Project"
          open={createVisible}
          onCancel={() => { setCreateVisible(false); form.resetFields(); }}
          onOk={() => form.submit()}
          confirmLoading={creating}
          okText="Create"
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="Project Name"
              rules={[
                { required: true, message: 'Name is required' },
                { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers, hyphens only' },
              ]}
            >
              <Input placeholder="my-project" />
            </Form.Item>
            <Form.Item
              name="path"
              label="Project Path"
              rules={[{ required: true, message: 'Path is required' }]}
            >
              <Input placeholder="/home/meridian/meridian-home/projects/my-project" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
```

**Step 2: Type check**

```bash
npm run type-check
```

Expected: clean.

**Step 3: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/src/pages/ProjectsPage.tsx
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(ui): rewrite Projects page to consume Stratavore projects API"
```

---

### Task 6: Update AppHeader Navigation

**Files:**
- Read and modify: `frontend/src/components/AppHeader.tsx`

**Step 1: Read the file first**

Check what navigation items AppHeader currently renders.

```bash
cat /home/meridian/meridian-home/projects/Lex-webui/frontend/src/components/AppHeader.tsx
```

**Step 2: Update navigation items**

Replace the nav items with the v3 pages. The exact edit depends on the file content but the target nav links are:

```
/ → Dashboard
/runners → Runners
/projects → Projects
```

Remove links to: `/tasks`, `/logs`, `/config`, `/projects/graph`.

The new nav menu array (replace wherever the links array is defined):

```typescript
const navItems = [
  { key: '/', label: 'Dashboard' },
  { key: '/runners', label: 'Runners' },
  { key: '/projects', label: 'Projects' },
];
```

**Step 3: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/src/components/AppHeader.tsx
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(ui): update AppHeader navigation for v3 pages"
```

---

### Task 7: Update App.tsx Routing, Remove Old Pages

**Files:**
- Modify: `frontend/src/App.tsx`
- Delete (or empty): `frontend/src/pages/TaskBoard.tsx`, `LogsPage.tsx`, `Configuration.tsx`, `ProjectGraph.tsx`

**Step 1: Rewrite `frontend/src/App.tsx`**

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import DashboardPage from './pages/DashboardPage';
import RunnersPage from './pages/RunnersPage';
import ProjectsPage from './pages/ProjectsPage';

const { Content } = Layout;

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Content>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/runners" element={<RunnersPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

Note: Auth context and login page are removed. Stratavore auth (JWT) is optional and disabled by default in local fleet use. If auth is required in future, Stratavore's `auth_secret` config enables it.

**Step 2: Remove old page files**

```bash
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/pages/TaskBoard.tsx
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/pages/LogsPage.tsx
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/pages/Configuration.tsx
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/pages/ProjectGraph.tsx
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/pages/LoginPage.tsx
```

Also remove old services that are now unused:

```bash
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/services/task.service.ts
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/services/config.service.ts
rm /home/meridian/meridian-home/projects/Lex-webui/frontend/src/services/auth.service.ts
```

Also remove auth context (no longer used):

```bash
rm -rf /home/meridian/meridian-home/projects/Lex-webui/frontend/src/contexts/
```

**Step 3: Verify TypeScript clean**

```bash
npm run type-check
```

Fix any remaining import errors (likely some component still importing deleted pages or auth context).

**Step 4: Build**

```bash
npm run build
```

Expected: build succeeds. Fix any remaining errors before proceeding.

**Step 5: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add -A frontend/src/
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "refactor: remove v1 pages and services, update routing for v3"
```

---

### Task 8: Update nginx Config

**Files:**
- Modify: `nginx/nginx.conf`

**Step 1: Read the full nginx config**

```bash
cat /home/meridian/meridian-home/projects/Lex-webui/nginx/nginx.conf
```

**Step 2: Replace the API proxy block**

Find the existing `location /api/` block (which currently proxies to `backend:3001`) and replace it with:

```nginx
# Stratavore HTTP API proxy
location /api/v1/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://stratavore:8080/api/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```

Remove the old `/api/` block and any rate limit zones used only by auth endpoints if auth is gone.

**Step 3: Update the Content-Security-Policy header**

The CSP `connect-src 'self'` is fine as-is since the API is same-origin via nginx.

**Step 4: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add nginx/
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "feat(nginx): replace backend:3001 proxy with Stratavore daemon proxy"
```

---

### Task 9: Update docker-compose.yml

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Read current docker-compose.yml**

```bash
cat /home/meridian/meridian-home/projects/Lex-webui/docker-compose.yml
```

**Step 2: Remove backend service, add stratavore reference**

- Remove the `backend:` service block entirely.
- Remove any `depends_on: backend` references from the nginx/frontend service.
- Add a `stratavore` service (or `external_links`/network reference) so nginx can resolve `stratavore:8080`.

If Stratavore runs as a separate Docker service or on the host:

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - frontend-dist:/app/dist

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - frontend-dist:/usr/share/nginx/html:ro
    environment:
      - STRATAVORE_HOST=${STRATAVORE_HOST:-host-gateway}
      - STRATAVORE_PORT=${STRATAVORE_PORT:-8080}
    extra_hosts:
      - "stratavore:host-gateway"

volumes:
  frontend-dist:
```

Note: `host-gateway` resolves to the host machine IP in Docker — appropriate when Stratavore runs on the host directly. Update nginx.conf to use `$STRATAVORE_HOST:$STRATAVORE_PORT` via envsubst if dynamic resolution is needed, or hardcode `host-gateway:8080` for simplicity.

**Step 3: Update .env.example**

Create or update `.env.example`:

```env
# Stratavore daemon connection
STRATAVORE_HOST=host-gateway
STRATAVORE_PORT=8080

# Frontend API URL (used by Vite in development)
VITE_STRATAVORE_API_URL=http://localhost:8080/api/v1
```

**Step 4: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add docker-compose.yml .env.example
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "chore: remove v1 backend from docker-compose, wire nginx to Stratavore"
```

---

### Task 10: Vite Dev Config and README Update

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `README.md`

**Step 1: Update `frontend/vite.config.ts` — add Stratavore dev proxy**

Read the current file first:

```bash
cat /home/meridian/meridian-home/projects/Lex-webui/frontend/vite.config.ts
```

Add a proxy block so `npm run dev` proxies `/api/v1` to a local Stratavore:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: process.env.VITE_STRATAVORE_API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

**Step 2: Update README.md**

Add a v3 section at the top:

```markdown
## v3 — Stratavore Integration

Lex-webui v3 replaces the v1 Node.js backend with direct integration against the
[Stratavore](https://github.com/Meridian-Lex/Stratavore) control plane HTTP API.

### Quick start (development)

```bash
# Start Stratavore daemon first
stratavored

# Then start the webui dev server
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

### Quick start (Docker)

```bash
# Copy and edit env
cp .env.example .env

# Build and start
docker compose up --build
# Open http://localhost:80
```

### Architecture

- **Frontend**: React/TypeScript/Vite + Ant Design — served by nginx
- **API**: nginx proxies `/api/v1/*` to the Stratavore daemon (default: `localhost:8080`)
- **No separate backend** — the Node.js v1 backend has been removed
```

**Step 3: Build final check**

```bash
npm run build && npm run type-check
```

Expected: clean build, no type errors.

**Step 4: Commit**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui add frontend/vite.config.ts README.md
git -C /home/meridian/meridian-home/projects/Lex-webui commit -m "chore: update Vite dev proxy and README for v3 architecture"
```

---

### Task 11: Push and Create PR

**Step 1: Run full test suite and build**

```bash
npm run test -- --reporter=verbose 2>&1 | tail -20
npm run build
```

Both must pass.

**Step 2: Push feature branch**

```bash
git -C /home/meridian/meridian-home/projects/Lex-webui push origin feature/v3-stratavore-integration
```

**Step 3: Create PR**

```bash
gh pr create \
  --repo Meridian-Lex/Lex-webui \
  --head feature/v3-stratavore-integration \
  --base main \
  --assignee LunarLaurus \
  --title "feat: v3 Stratavore integration — replace v1 backend with Stratavore HTTP API" \
  --body "$(cat <<'EOF'
## Summary

- Removes the v1 Node.js backend entirely
- Frontend now talks directly to the Stratavore daemon HTTP API via nginx proxy
- Three new/rewritten pages: Dashboard (daemon status + global metrics), Runners (list, launch, stop/kill), Projects (list, create)
- New TypeScript types derived from Stratavore proto messages
- All 9 webui-relevant HTTP endpoints covered in Phase 1
- Auth removed (delegated to optional Stratavore JWT config)

## Design Document

See \`docs/plans/2026-02-13-v3-stratavore-integration-design.md\`

## Phase 2 (next PR)

- Add missing HTTP endpoints to Stratavore (GetProject, DeleteProject, ListSessions, GetSession, GetMetrics)
- New webui pages: Sessions, Project Detail, Metrics

## Test plan

- [ ] \`npm run type-check\` passes
- [ ] \`npm run build\` succeeds
- [ ] \`npm run test\` passes
- [ ] Dashboard shows daemon status and global metrics against live Stratavore
- [ ] Runners page lists, launches, and stops runners
- [ ] Projects page lists and creates projects
- [ ] nginx proxy routes \`/api/v1/*\` to Stratavore correctly
- [ ] \`docker compose up --build\` starts cleanly (no backend container)
EOF
)"
```

**Step 4: Update TASK-QUEUE.md Task 30 status**

In `/home/meridian/meridian-home/lex-internal/state/TASK-QUEUE.md`, update Task 30 Status from IN PROGRESS to COMPLETE, add completion timestamp.

**Step 5: Commit time tracking**

```bash
cd /home/meridian/meridian-home/projects/Stratavore && python3 jobs/time_tracker.py end <session-id> "Task 30 Phase 1 complete"
```

---

## Phase 2 — Full Observability (separate PR)

To be executed after Phase 1 merges. Requires changes to both Stratavore and Lex-webui.

### Phase 2, Task A: Add Missing HTTP Endpoints to Stratavore

**File:** `Stratavore/internal/daemon/http_server.go`

Add to `NewHTTPServer()` mux registration:

```go
mux.HandleFunc("/api/v1/projects/get", httpServer.handleGetProject)
mux.HandleFunc("/api/v1/projects/delete", httpServer.handleDeleteProject)
mux.HandleFunc("/api/v1/sessions/list", httpServer.handleListSessions)
mux.HandleFunc("/api/v1/sessions/get", httpServer.handleGetSession)
mux.HandleFunc("/api/v1/metrics", httpServer.handleGetMetrics)
```

Implement each handler following the same pattern as existing handlers (delegate to `s.handler.<GRPCMethod>()`).

Commit to a feature branch in Stratavore, create PR.

### Phase 2, Task B: Sessions Page

New file: `frontend/src/pages/SessionsPage.tsx`

- Table: session ID, runner ID, project, started, ended, message count, tokens, resumable flag
- Filter by project/runner
- Link to runner detail (when runner page supports it)
- Route: `/sessions`

### Phase 2, Task C: Metrics Page

New file: `frontend/src/pages/MetricsPage.tsx`

- Bar chart: tokens per project (Recharts BarChart)
- Table: per-project active runners, avg CPU, total memory
- Route: `/metrics`

### Phase 2, Task D: Project Detail Page

New file: `frontend/src/pages/ProjectDetailPage.tsx`

- Route: `/projects/:name`
- Shows: project metadata, runner list (filtered by project), session list, token usage
- Archive/delete button

---

*Plan generated: 2026-02-13*
*Implementation: Phase 1 targets all 9 current Stratavore HTTP endpoints*
*Phase 2 requires 5 new HTTP endpoints added to Stratavore*
