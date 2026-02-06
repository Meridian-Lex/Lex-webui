# Lex Fleet Command Interface (v1.0)

Comprehensive web interface for the Meridian Lex autonomous development system.

## Features

✅ **Authentication**
- First-run admin account creation
- Secure session-based authentication
- bcrypt password hashing (12 rounds)

✅ **Dashboard**
- Current Lex operational mode (IDLE/AUTONOMOUS/DIRECTED/COLLABORATIVE)
- Mode control (Start/Stop autonomous operation)
- Token budget monitoring with visual gauge
- Current project display

✅ **Projects**
- List all projects from PROJECT-MAP.md
- Project status and relationships
- Sortable and filterable table view

✅ **Logs**
- Real-time log viewing with auto-refresh
- Level filtering (info, warning, error)
- Timestamp display

✅ **Security**
- Rate limiting on all endpoints
- CSRF protection
- SQL injection prevention
- Path traversal protection
- Comprehensive audit logging
- Secure httpOnly cookies
- Security headers (CSP, X-Frame-Options, etc.)

## Architecture

**Frontend:** React 18 + TypeScript + Vite + Ant Design
**Backend:** Node.js + Express + TypeScript + TypeORM
**Database:** PostgreSQL 16
**Cache:** Redis 7
**Proxy:** NGINX with security headers
**Deployment:** Docker Compose

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

## Quick Start

### 1. Generate Secrets

```bash
openssl rand -hex 32  # Database password
openssl rand -hex 64  # Session secret
```

### 2. Create .env File

```bash
cp .env.example .env
# Edit .env with your generated secrets
```

### 3. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Build

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### 5. Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 6. Access

Open http://localhost:3000

**First Run:** Create admin account
**Subsequent:** Login with credentials

## Development

### Backend Development

```bash
cd backend
npm run dev  # Hot reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Vite dev server on port 3000
```

### Database

```bash
# Run migrations
cd backend && npm run db:migrate

# Revert migration
npm run db:migrate:revert
```

## Testing

```bash
# Backend tests
cd backend && npm test

# Security tests
npm run test:security

# Frontend tests
cd frontend && npm test
```

## Project Structure

```
.
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, audit, rate limiting
│   │   ├── services/     # Lex filesystem integration
│   │   ├── models/       # Database models
│   │   ├── types/        # TypeScript types
│   │   └── config/       # Database and Redis config
│   └── tests/            # Unit and security tests
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API client
│   │   ├── hooks/        # React hooks
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── nginx/                 # NGINX configuration
├── docs/                  # Documentation
│   └── plans/            # Implementation plans
└── docker-compose.yml     # Container orchestration
```

## API Endpoints

### Authentication
- `POST /api/auth/setup` - First-run admin creation
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Status
- `GET /api/status` - Current Lex status
- `POST /api/status/mode` - Change operational mode
- `GET /api/status/health` - Health check

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:name` - Get project details

### Logs
- `GET /api/logs` - Retrieve logs

## Security Features

✅ **Authentication:** bcrypt password hashing, secure sessions
✅ **Rate Limiting:** Auth (5/15min), API (1000/15min), Commands (10/min)
✅ **Input Validation:** Joi schemas on all endpoints
✅ **SQL Injection Prevention:** TypeORM parameterized queries
✅ **Path Traversal Protection:** Whitelist MERIDIAN_HOME access
✅ **CSRF Protection:** Tokens on state-changing operations
✅ **Audit Logging:** All operations logged to PostgreSQL
✅ **Security Headers:** CSP, X-Frame-Options, X-XSS-Protection, etc.

## Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://...     # PostgreSQL connection
REDIS_URL=redis://...             # Redis connection
SESSION_SECRET=...                # Session encryption key
MERIDIAN_HOME=...                 # Lex home directory
NODE_ENV=production|development   # Environment
PORT=3001                         # Backend port
ALLOWED_ORIGINS=...               # CORS origins
```

## Troubleshooting

### Database Connection Failed
```bash
docker compose logs postgres
# Check DATABASE_URL in .env
```

### Redis Connection Failed
```bash
docker compose logs redis
# Check REDIS_URL in .env
```

### Backend Won't Start
```bash
cd backend && npm run build
docker compose restart backend
```

### Frontend Shows Blank Page
```bash
cd frontend && npm run build
docker compose restart nginx
```

## Deployment to Production

### 1. Set Production Environment

```bash
NODE_ENV=production
```

### 2. Use Strong Secrets

Generate new secrets for production (don't reuse development secrets).

### 3. Enable SSL/TLS

Update `nginx/nginx.conf` with SSL certificate paths.

### 4. Set Secure Cookie

Sessions will automatically use secure cookies in production.

### 5. Backup Strategy

```bash
# Database backup
docker compose exec postgres pg_dump -U lexuser lexwebui > backup.sql

# Restore
docker compose exec -T postgres psql -U lexuser lexwebui < backup.sql
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
```

### Metrics

Future: Prometheus + Grafana integration planned for v2.0

## Roadmap

### v1.1 (Planned)
- Token budget details with charts
- Task board integration
- Project relationship graph
- Configuration viewer

### v1.2 (Planned)
- Configuration editor
- Project creation wizard
- Task management CRUD
- Command executor

### v2.0 (Planned)
- WebSocket real-time updates
- Multi-user support
- Credential management UI
- Agent OS integration
- Prometheus + Grafana metrics

## License

Proprietary - For use with Meridian Lex system only.

## Support

For issues or questions, contact Fleet Commander Lauren.

---

**Lieutenant Meridian Lex** - Autonomous Development Vessel
*Built with security, scalability, and Fleet Command in mind.*
