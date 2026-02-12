# Lex-webui Fleet Command Interface - Architecture Design

**Date:** 2026-02-06
**Author:** Lieutenant Meridian Lex
**Approved By:** Fleet Commander Lauren
**Status:** Approved for Implementation

## Mission Statement

Comprehensive fleet command interface for the Meridian Lex autonomous development system. Provides operational control, project management, and configuration capabilities through a secure, scalable web interface.

## Deployment Timeline

- **v1.0** (Essential Operations): Tomorrow morning (2026-02-07 AM)
- **v1.1** (Full Monitoring): +24 hours (2026-02-07 PM)
- **v1.2** (Command & Control): +48 hours (2026-02-08 PM)
- **v2.0** (Complete Bridge): Next weekend (2026-02-15)

---

## System Overview

### Deployment Architecture

**Containerized microservices** via Docker Compose:
- **NGINX** - Reverse proxy, security headers, rate limiting, SSL-ready
- **Node.js API** - Express (TypeScript), business logic, filesystem access
- **PostgreSQL 16** - Users, sessions, audit logs, project metadata
- **Redis 7** - Session storage, API cache, pub/sub ready

**Deployment Model:**
- Local-first: Primary operation on localhost:3000
- Hybrid-capable: Network access with authentication for remote monitoring
- Security-first: All operations audited, rate limited, input validated

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tooling, hot reload)
- Ant Design (UI components)
- Axios (API client)

**Backend:**
- Node.js + Express (TypeScript)
- TypeORM (database ORM)
- bcrypt (password hashing)
- express-session + connect-redis (session management)
- Joi (input validation)

**Infrastructure:**
- Docker Compose (orchestration)
- PostgreSQL 16 (persistent data)
- Redis 7 (cache + sessions)
- NGINX (reverse proxy)

### Update Strategy

**Phase 1 (v1.0-v1.2):** Periodic polling
- Status: 5-second intervals
- Projects: 30-second intervals
- Logs: 10-second intervals

**Phase 2 (v2.0+):** WebSocket upgrade
- Real-time status updates
- Live log streaming
- Instant notification of mode changes

---

## Application Structure

### Frontend Architecture

```
src/
├── components/ # Reusable UI components
│ ├── auth/ # Login, user management
│ │ ├── LoginForm.tsx
│ │ ├── FirstRunSetup.tsx
│ │ └── UserProfile.tsx
│ ├── dashboard/ # Status cards, metrics
│ │ ├── StatusCard.tsx
│ │ ├── TokenBudgetGauge.tsx
│ │ ├── ModeControl.tsx
│ │ └── CurrentProject.tsx
│ ├── projects/ # Project management
│ │ ├── ProjectList.tsx
│ │ ├── ProjectCard.tsx
│ │ ├── ProjectDetail.tsx
│ │ ├── ProjectGraph.tsx (v1.1)
│ │ └── ProjectCreator.tsx (v1.2)
│ ├── logs/ # Log viewing
│ │ ├── LogViewer.tsx
│ │ ├── LogFilter.tsx
│ │ └── LogExport.tsx
│ ├── config/ # Configuration
│ │ ├── ConfigViewer.tsx (v1.1)
│ │ ├── ConfigEditor.tsx (v1.2)
│ │ └── ConfigValidation.tsx (v1.2)
│ └── tasks/ # Task management
│ ├── TaskBoard.tsx (v1.1)
│ └── TaskManager.tsx (v1.2)
├── pages/ # Route-level components
│ ├── Dashboard.tsx # Main overview
│ ├── Projects.tsx # Project management
│ ├── Logs.tsx # Log viewing
│ ├── Tasks.tsx # Task board (v1.1)
│ ├── Config.tsx # Configuration (v1.1)
│ └── Settings.tsx # User settings
├── services/ # API client
│ ├── api.ts # Axios instance, interceptors
│ ├── auth.service.ts
│ ├── status.service.ts
│ ├── projects.service.ts
│ ├── logs.service.ts
│ ├── config.service.ts
│ └── tasks.service.ts
├── hooks/ # Custom React hooks
│ ├── useAuth.ts
│ ├── useStatus.ts
│ ├── usePolling.ts
│ └── useWebSocket.ts (v2.0)
├── types/ # TypeScript definitions
│ ├── auth.types.ts
│ ├── status.types.ts
│ ├── project.types.ts
│ └── api.types.ts
├── utils/ # Helper functions
│ ├── dateFormat.ts
│ ├── tokenCalculator.ts
│ └── validators.ts
└── App.tsx # Root component, routing
```

### Backend Architecture

```
src/
├── routes/
│ ├── auth.ts # Authentication endpoints
│ ├── status.ts # Lex status, mode, state
│ ├── projects.ts # Project CRUD, relationships
│ ├── logs.ts # Log retrieval, filtering
│ ├── config.ts # Configuration read/write
│ ├── tasks.ts # Task management (v1.1)
│ └── commands.ts # Execute Lex operations (v1.2)
├── middleware/
│ ├── auth.ts # Session validation
│ ├── rateLimit.ts # Rate limiting
│ ├── audit.ts # Audit logging
│ ├── validation.ts # Input validation
│ └── errorHandler.ts # Centralized error handling
├── services/
│ ├── lexFileSystem.ts # Read/write Lex files
│ ├── lexCommands.ts # Execute lex CLI
│ ├── tokenBudget.ts # Parse/update budgets
│ ├── projectMap.ts # Parse PROJECT-MAP.md
│ └── stateManager.ts # Parse/update STATE.md
├── models/ # Database models (TypeORM)
│ ├── User.ts
│ ├── Session.ts
│ ├── AuditLog.ts
│ └── ProjectCache.ts (v1.1)
├── types/ # Shared TypeScript types
├── config/ # Configuration
│ ├── database.ts
│ ├── redis.ts
│ └── security.ts
└── server.ts # Express app setup
```

---

## Feature Roadmap

### v1.0 - Essential Operations (Tomorrow Morning)

**Authentication:**
- First-run admin account creation
- Login/logout with session management
- Secure password storage (bcrypt)

**Dashboard:**
- Current Lex mode (IDLE/AUTONOMOUS/DIRECTED/COLLABORATIVE)
- Current project focus
- Token budget gauge (daily usage)
- Quick mode control (start/stop autonomous)

**Project List:**
- Basic listing from PROJECT-MAP.md
- Project status indicators
- Click to view project details

**Log Viewer:**
- Tail recent Lex logs
- Basic filtering (error, warning, info)
- Auto-refresh every 10 seconds

### v1.1 - Full Monitoring (+24 hours)

**Token Budget Details:**
- Daily limit tracking
- Per-session usage
- Reserved vs available tokens
- Historical usage charts

**Task Board:**
- Current task list from daily-todo.md
- Task status (pending/in-progress/completed)
- Task priority indicators

**Project Relationships:**
- Visual graph of project dependencies
- Shared code indicators
- Related projects grouping

**Configuration Viewer:**
- Read-only view of LEX-CONFIG.yaml
- Syntax-highlighted display
- Current settings explanation

### v1.2 - Command & Control (+48 hours)

**Configuration Editor:**
- Edit LEX-CONFIG.yaml in-app
- YAML validation
- Backup before save
- Audit trail of changes

**Project Creator:**
- Create new projects via UI
- Template selection
- Automatic directory structure
- Git initialization

**Task Manager:**
- Create new tasks
- Update task status
- Mark tasks complete
- Organize by priority

**Command Executor:**
- Execute lex commands (`lex --state`, `lex --map`, etc.)
- View command output
- Command history
- Safety confirmations for destructive operations

### v2.0 - Complete Bridge (Next Weekend)

**Project Creation Wizard:**
- Step-by-step project setup
- Tech stack selection
- Agent OS integration
- Initial scaffolding

**Credential Management:**
- View available credentials from secrets.yaml
- Masked display (show last 4 chars)
- Credential health checks
- Expiry warnings

**Agent OS Integration:**
- Discover standards via UI
- Inject standards into projects
- Shape specs with templates
- Index standards browser

**Advanced Features:**
- WebSocket real-time updates
- Multi-user support
- Role-based access control
- Advanced audit log viewer
- Export/import configurations

**Future Enhancements:**
- Prometheus + Grafana metrics
- Long-term trend analysis
- Performance profiling
- Predictive analytics

---

## API Design

### Authentication Endpoints

```
POST /api/auth/setup
  Body: { username, password, confirmPassword }
  Response: { user: { id, username, role } }
  Notes: Only available if no users exist

POST /api/auth/login
  Body: { username, password }
  Response: { user: { id, username, role } }
  Sets session cookie

POST /api/auth/logout
  Response: { success: true }
  Destroys session

GET /api/auth/me
  Response: { user: { id, username, role, lastLogin } }
  Requires authentication
```

### Status Endpoints

```
GET /api/status
  Response: {
    mode: 'IDLE' | 'AUTONOMOUS' | 'DIRECTED' | 'COLLABORATIVE',
    currentProject: string | null,
    tokenBudget: {
      dailyLimit: number,
      used: number,
      remaining: number,
      reserved: number
    },
    lastUpdated: timestamp
  }

POST /api/status/mode
  Body: { mode: 'IDLE' | 'AUTONOMOUS' | 'DIRECTED' }
  Response: { mode, success: true }
  Notes: Updates STATE.md, audit logged

GET /api/status/health
  Response: {
    api: 'healthy',
    database: 'healthy',
    redis: 'healthy',
    filesystem: 'healthy'
  }
```

### Project Endpoints

```
GET /api/projects
  Query:?status=active&sort=name
  Response: {
    projects: [
      {
        name: string,
        path: string,
        status: string,
        lastActivity: timestamp,
        relationships: string[]
      }
    ]
  }

GET /api/projects/:name
  Response: {
    name: string,
    path: string,
    status: string,
    description: string,
    relationships: { dependencies: string[], related: string[] },
    gitStatus: { branch: string, uncommitted: number },
    lastActivity: timestamp
  }

POST /api/projects (v1.2)
  Body: {
    name: string,
    template?: string,
    description?: string
  }
  Response: { project: { name, path, status } }
  Notes: Creates directory, initializes git, updates PROJECT-MAP.md

PUT /api/projects/:name (v1.2)
  Body: { status?: string, description?: string }
  Response: { project: {...}, success: true }
```

### Log Endpoints

```
GET /api/logs
  Query:?lines=100&level=error&since=timestamp
  Response: {
    logs: [
      {
        timestamp: string,
        level: 'info' | 'warning' | 'error',
        message: string,
        context?: object
      }
    ]
  }
```

### Configuration Endpoints

```
GET /api/config (v1.1)
  Response: {
    config: {
      dailyLimit: number,
      perSessionTarget: number,
      reservedForCommander: number,
      autonomousMode: boolean,
      ...
    },
    source: 'LEX-CONFIG.yaml'
  }

PUT /api/config (v1.2)
  Body: { config: {...} }
  Response: { success: true, backup: string }
  Notes: Creates backup, validates YAML, audit logged
```

### Task Endpoints (v1.1)

```
GET /api/tasks
  Response: {
    tasks: [
      {
        id: string,
        title: string,
        status: 'pending' | 'in-progress' | 'completed',
        priority: number,
        created: timestamp
      }
    ]
  }

POST /api/tasks (v1.2)
  Body: { title, description?, priority? }
  Response: { task: {...}, success: true }

PATCH /api/tasks/:id (v1.2)
  Body: { status?, priority? }
  Response: { task: {...}, success: true }
```

### Command Endpoints (v1.2)

```
POST /api/commands/execute
  Body: {
    command: 'state' | 'map' | 'new',
    args?: string[]
  }
  Response: {
    output: string,
    exitCode: number,
    executedAt: timestamp
  }
  Notes: Whitelist of allowed commands, no shell injection
```

---

## Data Models

### PostgreSQL Schema

**users:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
```

**sessions:**
```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);
```

**audit_logs:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

**project_cache (v1.1):**
```sql
CREATE TABLE project_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  path TEXT NOT NULL,
  status VARCHAR(100),
  relationships JSONB,
  metadata JSONB,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_cache_name ON project_cache(name);
CREATE INDEX idx_project_cache_status ON project_cache(status);
```

### Redis Key Schema

**Sessions:**
- `sess:{sid}` → Session data (TTL: 24 hours)

**Cache:**
- `cache:status` → Lex status JSON (TTL: 5 seconds)
- `cache:projects` → Project list JSON (TTL: 30 seconds)
- `cache:logs:{filter}` → Filtered logs JSON (TTL: 10 seconds)
- `cache:config` → LEX-CONFIG.yaml parsed (TTL: 60 seconds)

**Pub/Sub (v2.0):**
- `pubsub:status` → Real-time status updates
- `pubsub:logs` → Real-time log streaming

---

## Security Implementation

### Authentication & Authorization

**Password Security:**
- bcrypt hashing (cost factor 12)
- Automatic salting
- Minimum password length: 8 characters
- Password strength validation

**Session Management:**
- Redis-backed sessions
- 24-hour expiry (sliding window)
- Secure httpOnly cookies
- SameSite=Strict attribute
- Session regeneration on login

**First-Run Setup:**
- Admin creation only when users table is empty
- Endpoint permanently disabled after first user
- Strong password requirement enforced

**Role-Based Access Control (v2.0):**
- `admin`: Full access (read/write all resources)
- `viewer`: Read-only access (view status, logs, configs)

### API Security

**Rate Limiting:**
```
Auth endpoints: 5 requests/minute per IP
API endpoints: 1000 requests/15min per session
Command execution: 10 requests/minute per session
```

**Input Validation:**
- Joi schemas on all request bodies
- Type checking via TypeScript
- Whitelist allowed values (modes, commands, etc.)
- Maximum field lengths enforced
- Sanitization of user input

**Injection Prevention:**
- **SQL Injection**: TypeORM parameterized queries only, no raw SQL
- **Command Injection**: Whitelist of allowed lex commands, no shell execution with user input
- **Path Traversal**: Restrict filesystem access to `~/meridian-home/*` only
- **XSS**: React auto-escaping, Content-Security-Policy headers

**CSRF Protection:**
- CSRF tokens on all state-changing operations
- Double-submit cookie pattern
- Referer header validation

### Network Security (NGINX)

**Security Headers:**
```nginx
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Rate Limiting (Proxy Level):**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req zone=api burst=20 nodelay;
limit_req zone=auth burst=3 nodelay;
```

**SSL/TLS (Remote Access):**
- TLS 1.2+ only
- Strong cipher suites
- HSTS enabled
- Certificate from Let's Encrypt

### Audit Trail

**All Operations Logged:**
- User login/logout events
- Failed authentication attempts
- Mode changes (IDLE → AUTONOMOUS, etc.)
- Configuration edits (before/after values)
- Project creation/modification
- Command executions
- Session activity (last seen, IP changes)

**Audit Log Retention:**
- 90 days in PostgreSQL
- Queryable via API (v2.0)
- Exportable for external analysis

### Secrets Management

**Environment Variables (.env):**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SESSION_SECRET=<generated-on-first-run>
MERIDIAN_HOME=/home/meridian/meridian-home
NODE_ENV=production
```

**File Permissions:**
- `.env` file: 600 (owner read/write only)
- Secrets.yaml integration: Read-only access, never exposed via API

---

## Deployment Configuration

### Docker Compose

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      -./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      -./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context:./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://lexuser:${DB_PASSWORD}@postgres:5432/lexwebui
      - REDIS_URL=redis://redis:6379
      - SESSION_SECRET=${SESSION_SECRET}
      - MERIDIAN_HOME=/meridian-home
    volumes:
      - /home/meridian/meridian-home:/meridian-home:ro
      -./logs:/var/log/lex-webui
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=lexwebui
      - POSTGRES_USER=lexuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### NGINX Configuration

**File: `nginx/nginx.conf`**
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'" always;

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Auth endpoints (stricter rate limiting)
        location /api/auth/ {
            limit_req zone=auth burst=3 nodelay;
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Environment Setup

**File: `.env.example`**
```bash
# Database
DB_PASSWORD=generate_secure_password_here

# Session
SESSION_SECRET=generate_secure_secret_here

# Lex Integration
MERIDIAN_HOME=/home/meridian/meridian-home

# Application
NODE_ENV=production
PORT=3001

# Optional: Remote access
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

---

## Testing Strategy

### Security Testing (Priority: CRITICAL)

**Authentication Tests:**
- [OK] First-run setup only available when no users exist
- [OK] Setup endpoint disabled after first user created
- [OK] Login with correct credentials succeeds
- [OK] Login with incorrect credentials fails
- [OK] Password hashing uses bcrypt (verify never plaintext)
- [OK] Session creation sets httpOnly, secure cookies
- [OK] Session expiry enforced (24 hours)
- [OK] Logout destroys session completely
- [OK] Unauthenticated requests to protected endpoints rejected

**Injection Tests:**
- [OK] SQL injection attempts blocked (test all input fields)
- [OK] Command injection attempts blocked (test command executor)
- [OK] Path traversal attempts blocked (test file operations)
- [OK] XSS payloads escaped (test all text rendering)
- [OK] CSRF tokens validated on state-changing operations
- [OK] Malformed JSON rejected with proper error handling

**Rate Limiting Tests:**
- [OK] Auth endpoints: >5/min blocked
- [OK] API endpoints: >1000/15min blocked
- [OK] Command executor: >10/min blocked
- [OK] Rate limits reset after window expires

**Authorization Tests:**
- [OK] Admin can access all endpoints
- [OK] Viewer can only read, not modify (v2.0)
- [OK] Unauthenticated users redirected to login
- [OK] Session hijacking prevented (verify SameSite)

**Data Validation Tests:**
- [OK] Invalid mode changes rejected
- [OK] Invalid project names rejected
- [OK] Invalid configuration YAML rejected
- [OK] Overly long inputs rejected
- [OK] Type mismatches rejected

### Unit Tests

**Backend Services:**
- `lexFileSystem.ts`: Read STATE.md, PROJECT-MAP.md, LEX-CONFIG.yaml
- `lexCommands.ts`: Execute whitelisted commands, reject unauthorized
- `tokenBudget.ts`: Parse budget data, calculate remaining
- All API routes: Request validation, response format, error handling

**Frontend Components:**
- `LoginForm`: Form validation, submission, error display
- `StatusCard`: Data rendering, mode display, polling
- `LogViewer`: Filtering, auto-refresh, export
- `ConfigEditor`: YAML validation, save confirmation (v1.2)

### Integration Tests

**Full Request/Response Cycles:**
- User login → session creation → authenticated request → logout
- Mode change → STATE.md update → audit log created
- Config edit → backup created → YAML validated → file written (v1.2)
- Project creation → directory created → git initialized → map updated (v1.2)

**Database Operations:**
- User CRUD operations
- Session storage and retrieval (Redis)
- Audit log writing and querying
- Cache invalidation on updates

### End-to-End Tests (Playwright)

**Critical User Flows:**
1. First-run admin creation → login → view dashboard
2. Start autonomous mode → verify STATE.md updated → stop mode
3. View logs → apply filter → verify filtered results
4. View project list → click project → see details
5. Edit config → save → verify backup created → verify file updated (v1.2)

### Performance Tests

**Load Testing:**
- 100 concurrent users polling status
- Stress test rate limiting
- Database connection pool under load
- Redis cache hit/miss ratios

**Response Time Targets:**
- API endpoints: <100ms (p95)
- Static assets: <50ms (p95)
- Database queries: <50ms (p95)

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
cd ~/meridian-home/projects/Lex-webui

# Generate secrets
openssl rand -hex 32 >.db-password
openssl rand -hex 64 >.session-secret

# Create.env file
cat >.env << EOF
DB_PASSWORD=$(cat.db-password)
SESSION_SECRET=$(cat.session-secret)
MERIDIAN_HOME=/home/meridian/meridian-home
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
EOF

# Start services
docker-compose up -d

# Install dependencies
cd backend && npm install
cd../frontend && npm install

# Run database migrations
cd../backend && npm run db:migrate

# Start development servers
npm run dev # Both frontend and backend
```

### Development Commands

**Backend:**
```bash
npm run dev # Start with hot reload
npm run build # Compile TypeScript
npm run test # Run unit tests
npm run test:security # Run security tests
npm run db:migrate # Run migrations
npm run db:seed # Seed test data
npm run lint # ESLint check
```

**Frontend:**
```bash
npm run dev # Start Vite dev server
npm run build # Build for production
npm run test # Run Vitest unit tests
npm run test:e2e # Run Playwright E2E tests
npm run lint # ESLint check
npm run type-check # TypeScript check
```

### Git Workflow

**Branching Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/v1.0-*` - v1.0 features
- `feature/v1.1-*` - v1.1 features
- `feature/v1.2-*` - v1.2 features

**Commit Convention:**
```
feat(auth): implement first-run admin setup
fix(logs): correct timestamp formatting
docs(api): add endpoint documentation
test(security): add SQL injection tests
chore(deps): upgrade TypeScript to 5.3

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Code Review Checkpoints

- [ ] All security tests passing
- [ ] No SQL injection vulnerabilities
- [ ] No command injection vulnerabilities
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CSRF protection implemented
- [ ] Audit logging functional
- [ ] TypeScript strict mode enabled
- [ ] ESLint warnings resolved
- [ ] E2E tests passing

---

## Monitoring & Maintenance

### Application Logs

**Location:** `/var/log/lex-webui/`
- `application.log` - General application logs
- `error.log` - Error stack traces
- `audit.log` - Security audit trail
- `access.log` - NGINX access logs

**Log Rotation:** Daily, keep 30 days

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# Database connectivity
docker-compose exec backend npm run db:check

# Redis connectivity
docker-compose exec redis redis-cli ping
```

### Backup Strategy

**Database Backups:**
```bash
# Daily backup
docker-compose exec postgres pg_dump -U lexuser lexwebui > backup-$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U lexuser lexwebui < backup-20260206.sql
```

**Configuration Backups:**
- Created automatically before config edits
- Stored in `~/meridian-home/.lex-webui-backups/`
- Retention: 30 days

### Performance Monitoring (v2.0+)

**Prometheus Metrics:**
- HTTP request duration (histogram)
- API endpoint hit counts (counter)
- Database query duration (histogram)
- Redis cache hit/miss ratio (gauge)
- Active sessions (gauge)
- Token budget usage (gauge)

**Grafana Dashboards:**
- System health overview
- API performance metrics
- Token usage trends
- Project activity heatmap
- Autonomous mode effectiveness

---

## Security Audit Checklist

Before deployment, verify:

- [ ] All passwords bcrypt-hashed (cost factor 12)
- [ ] Session cookies httpOnly, secure, SameSite=Strict
- [ ] CSRF tokens on all POST/PUT/DELETE endpoints
- [ ] Rate limiting configured on all endpoints
- [ ] SQL injection tests passing
- [ ] Command injection tests passing
- [ ] Path traversal tests passing
- [ ] XSS prevention verified
- [ ] Security headers configured (NGINX)
- [ ] Input validation on all user input
- [ ] Audit logging functional
- [ ] Database credentials not in code
- [ ].env file permissions 600
- [ ] No sensitive data in logs
- [ ] Error messages don't leak system info
- [ ] HTTPS configured for remote access
- [ ] Strong cipher suites enabled
- [ ] Dependency vulnerabilities checked (`npm audit`)
- [ ] Code review completed by Fleet Commander

---

## Project Structure

```
Lex-webui/
├── backend/
│ ├── src/
│ │ ├── routes/
│ │ ├── middleware/
│ │ ├── services/
│ │ ├── models/
│ │ ├── types/
│ │ ├── config/
│ │ └── server.ts
│ ├── tests/
│ │ ├── unit/
│ │ ├── integration/
│ │ └── security/
│ ├── migrations/
│ ├── Dockerfile
│ ├── package.json
│ └── tsconfig.json
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ ├── hooks/
│ │ ├── types/
│ │ ├── utils/
│ │ └── App.tsx
│ ├── tests/
│ │ ├── unit/
│ │ └── e2e/
│ ├── public/
│ ├── package.json
│ ├── vite.config.ts
│ └── tsconfig.json
├── nginx/
│ └── nginx.conf
├── docs/
│ ├── plans/
│ │ └── 2026-02-06-lex-webui-design.md (this file)
│ ├── api/
│ └── deployment/
├── docker-compose.yml
├──.env.example
├──.gitignore
└── README.md
```

---

## Acceptance Criteria

### v1.0 (Essential Operations)
- [x] Design approved by Fleet Commander
- [ ] User can create admin account on first run
- [ ] User can log in with username/password
- [ ] Dashboard shows current Lex mode
- [ ] Dashboard shows current project
- [ ] Dashboard shows token budget gauge
- [ ] User can start/stop autonomous mode
- [ ] User can view project list
- [ ] User can view recent logs with filtering
- [ ] All security tests passing
- [ ] Deployed via Docker Compose
- [ ] Documentation complete

### v1.1 (Full Monitoring)
- [ ] Token budget details visible
- [ ] Task board displays current tasks
- [ ] Project relationship graph visible
- [ ] Configuration viewer shows LEX-CONFIG.yaml
- [ ] Historical usage charts functional

### v1.2 (Command & Control)
- [ ] Configuration editor with YAML validation
- [ ] Project creator functional
- [ ] Task manager allows CRUD operations
- [ ] Command executor with whitelist security
- [ ] All edit operations create backups
- [ ] Audit logs capture all changes

### v2.0 (Complete Bridge)
- [ ] Project creation wizard
- [ ] Credential management UI
- [ ] Agent OS integration
- [ ] WebSocket real-time updates
- [ ] Multi-user support
- [ ] Advanced audit log viewer
- [ ] Prometheus + Grafana integration

---

## Conclusion

This design provides a secure, scalable, and comprehensive fleet command interface for the Meridian Lex system. The progressive rollout strategy (v1.0 → v1.1 → v1.2 → v2.0) ensures rapid initial deployment while maintaining architectural flexibility for future enhancements.

**Key Architectural Strengths:**
- Security-first design with comprehensive testing
- Containerized deployment for portability and scalability
- Type-safe throughout (TypeScript front-to-back)
- Audit trail for all operations
- Ready for WebSocket upgrade to real-time
- Prepared for metrics and monitoring integration

**Lieutenant Lex ready to commence implementation.**

---

**Approved for implementation:** 2026-02-06
**Fleet Commander Lauren**
