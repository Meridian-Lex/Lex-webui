# Design: Lex-webui v3 — Stratavore Integration

**Date**: 2026-02-13
**Author**: Meridian Lex
**Branch**: `feature/v3-stratavore-integration`
**Status**: Approved (Fleet Admiral Lunar Laurus, 2026-02-13 morning)

---

## Overview

Replace the Lex-webui v1 backend (Node.js, reads local filesystem) with direct integration against the Stratavore v3 control plane HTTP API. The webui becomes the browser-based interface to Stratavore's operational state: runner lifecycle, project management, daemon health, and system metrics.

All Stratavore HTTP endpoints are covered. Endpoints currently gRPC-only will be surfaced in Phase 2 via new HTTP wrappers added to Stratavore.

---

## Problem Statement

Lex-webui v1 reads data from local files (STATE.md, TASK-QUEUE.md, LEX-CONFIG.yaml, log files). This is a dead end — Stratavore is the new source of operational truth. The webui must speak Stratavore's API, not the filesystem.

---

## Stratavore API Inventory

### HTTP Endpoints (Phase 1 — all implemented today)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Daemon liveness check |
| GET | `/api/v1/status` | Daemon status + global metrics |
| POST | `/api/v1/reconcile` | Trigger stale runner cleanup |
| GET | `/api/v1/runners/list?project=<name>` | List all runners (optional project filter) |
| GET | `/api/v1/runners/get?id=<runner_id>` | Get single runner detail |
| POST | `/api/v1/runners/launch` | Launch a new runner |
| POST | `/api/v1/runners/stop` | Stop a runner (graceful or force) |
| GET | `/api/v1/projects/list?status=<status>` | List all projects (optional status filter) |
| POST | `/api/v1/projects/create` | Create a new project |

Note: `/api/v1/heartbeat` is agent-facing only; not surfaced in the webui.

### gRPC-only Endpoints (Phase 2 — require HTTP wrappers in Stratavore)

| gRPC Method | Proposed HTTP | Purpose |
|-------------|---------------|---------|
| `GetProject` | GET `/api/v1/projects/get?name=<name>` | Project detail view |
| `DeleteProject` | POST `/api/v1/projects/delete` | Project archival/deletion |
| `ListSessions` | GET `/api/v1/sessions/list?project=<name>&runner_id=<id>` | Session history |
| `GetSession` | GET `/api/v1/sessions/get?id=<id>` | Session detail |
| `GetMetrics` | GET `/api/v1/metrics` | Per-project metrics breakdown |

Note: `AttachRunner` (bidirectional gRPC streaming) is Phase 3 only — requires WebSocket proxy.

---

## Architecture

### Phase 1 Architecture

```
Browser
  |
  | HTTPS/80
  v
nginx (existing)
  |-- /* ---------> frontend/dist/ (static files, React SPA)
  |-- /api/v1/* --> Stratavore daemon HTTP API (configurable port, default 8080)
```

The Node.js backend is removed entirely. nginx becomes the only server component in the webui stack.

### Auth Strategy

Stratavore's JWT auth is optional (disabled when `auth_secret` is empty). For Phase 1:
- If `STRATAVORE_AUTH_SECRET` is set in the daemon, the webui prompts for a JWT token.
- If not set (local default), the webui operates without auth — this is the expected local fleet use case.
- The existing Lex-webui auth pages (setup/login) are removed. Auth is delegated entirely to Stratavore.

---

## Phase 1 — Core Control Plane Rewrite

### New Page Structure

| Route | Page | Data Source |
|-------|------|-------------|
| `/` | DashboardPage | GET /status + poll 5s |
| `/runners` | RunnersPage | GET /runners/list + detail + actions |
| `/projects` | ProjectsPage | GET /projects/list + create |
| `/health` | (embedded in Dashboard header) | GET /health |

### Removed Pages

- TaskBoard — tasks come from Stratavore sessions/runners, not TASK-QUEUE.md
- LogsPage — Stratavore has its own log infrastructure
- Configuration — LEX-CONFIG.yaml is no longer the config source
- ProjectGraph — network graph of local project relationships; not applicable

### New TypeScript Types (`src/types/stratavore.ts`)

Typed directly from proto messages:

```typescript
interface Runner {
  id: string;
  runtimeType: string;
  projectName: string;
  projectPath: string;
  status: 'running' | 'paused' | 'terminated' | 'failed';
  flags: string[];
  sessionId: string;
  conversationMode: string;
  tokensUsed: number;
  cpuPercent: number;
  memoryMb: number;
  restartAttempts: number;
  startedAt: string;
  lastHeartbeat: string;
  terminatedAt?: string;
  exitCode?: number;
}

interface Project {
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
}

interface DaemonStatus {
  daemonId: string;
  hostname: string;
  version: string;
  startedAt: string;
  healthy: boolean;
}

interface GlobalMetrics {
  activeRunners: number;
  activeProjects: number;
  totalSessions: number;
  tokensUsed: number;
  tokenLimit: number;
}
```

### New API Service (`src/services/stratavore.service.ts`)

Replaces all v1 services (task.service.ts, config.service.ts, auth.service.ts).

Groups: `runnerApi`, `projectApi`, `statusApi` — all calling `/api/v1/*`.

### nginx Config Changes

Remove the `location /api/` block pointing to `backend:3001`.
Add a new block:

```nginx
location /api/v1/ {
    proxy_pass http://stratavore:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Where `stratavore` resolves to the Stratavore daemon (Docker service name or host:port, configurable via env var).

### docker-compose Changes

Remove `backend` service entirely.
Add `stratavore` service reference (or external network for connecting to a running Stratavore daemon).

---

## Phase 2 — Full Observability

Requires adding HTTP endpoints to Stratavore's `http_server.go`:

| New Endpoint | Handler Logic |
|--------------|---------------|
| GET `/api/v1/projects/get?name=<name>` | call `s.handler.GetProject()` |
| POST `/api/v1/projects/delete` | call `s.handler.DeleteProject()` |
| GET `/api/v1/sessions/list` | call `s.handler.ListSessions()` |
| GET `/api/v1/sessions/get?id=<id>` | call `s.handler.GetSession()` |
| GET `/api/v1/metrics` | call `s.handler.GetMetrics()` |

New webui pages:
- `/sessions` — session history with resumable flag, message count, token usage
- `/projects/:name` — project detail with metrics and session list
- `/metrics` — per-project metrics breakdown with charts

---

## Phase 3 — Advanced (Future)

- WebSocket proxy for `AttachRunner` gRPC streaming — in-browser terminal
- Server-Sent Events for real-time runner status updates (removes polling)
- Event log viewer fed from Stratavore's event table

---

## Dashboard Design (Phase 1)

```
+----------------------------------------------------------+
| Stratavore Control Plane          [HEALTHY] v0.1         |
+----------------------------------------------------------+
|                                                          |
| [Active Runners: 3]  [Active Projects: 5]               |
| [Total Sessions: 42] [Tokens Used: 1.2M / 10M]          |
|                                                          |
+--[Runners]-----------------------------------------------+
| ID         | Project    | Status  | Tokens  | CPU | MEM  |
| runner_abc | my-project | running | 45,231  | 12% | 180M |
| runner_def | stratavore | running | 12,005  |  3% |  90M |
|            [Launch Runner]  [Reconcile]                   |
+--[Projects]----------------------------------------------+
| Name       | Status  | Active Runners | Total Tokens      |
| my-project | active  | 1              | 128,450           |
| stratavore | active  | 1              |  45,231           |
|            [New Project]                                  |
+----------------------------------------------------------+
```

---

## Implementation Sequence

1. Create `src/types/stratavore.ts` — all types from proto
2. Create `src/services/stratavore.service.ts` — full API client
3. Build `DashboardPage` against real `/api/v1/status`
4. Build `RunnersPage` — list, launch, stop
5. Build `ProjectsPage` — list, create
6. Update `App.tsx` routing
7. Remove v1 pages and services
8. Update nginx config
9. Update docker-compose (remove backend service)
10. Update environment config (VITE_STRATAVORE_API_URL)
11. Update README with new architecture

---

## What is Preserved from v1

- React/TypeScript/Vite stack — no framework change
- Ant Design components — same UI library
- nginx as the serving layer
- Overall layout and AppHeader pattern

## What is Replaced

- Node.js backend → removed entirely
- All data sources (filesystem) → Stratavore HTTP API
- Auth system → optional, delegated to Stratavore
- Page set (Tasks, Logs, Config, ProjectGraph) → new Stratavore-native pages
