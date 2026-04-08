# Deployment and Operations

---

## Infrastructure Overview

| Component | Detail |
|-----------|--------|
| NAS | Synology DS1522+ |
| NAS IP | `192.168.50.200` |
| Docker root | `/volume1/docker/` |
| Container orchestration | Portainer (`portainer.yujan.synology.me`) |
| Networking | Cloudflare Tunnel (`synology-main`) |
| Auth | Cloudflare Access (no app-level authentication) |
| User/Group | `PUID=1026`, `PGID=100` |
| Timezone | `America/Vancouver` |
| Daily restart | 4:00 AM (triggers data sync) |

---

## Standard File Structure

Every MCP server follows this layout:

```
mcp-[role]/
├── CLAUDE.md                  # Claude Code entry point + constraints
├── README.md                  # Project overview
├── docs/
│   ├── PRD.md                # Product requirements
│   ├── DATA_SCHEMA.md        # JSON file schemas
│   ├── API_SPEC.md           # Tool specifications
│   └── DEPLOYMENT.md         # NAS deployment guide
├── src/
│   ├── __init__.py
│   ├── server.py             # FastMCP entry point
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── read.py           # Read-only tools
│   │   └── updates.py        # Write tools (if applicable)
│   └── storage/
│       ├── __init__.py
│       └── json_store.py     # Git auto-commit storage layer
├── data/                      # JSON data files (Git-tracked)
│   └── *.json
├── data-defaults/             # (read-only servers only) pristine copies
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── requirements.txt
└── .gitignore
```

---

## Standard Patterns

### server.py Pattern

Every server entry point follows this exact structure:

```python
import os
import uvicorn
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "80XX"))

mcp = FastMCP(
    "mcp-[role]",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=False,  # CRITICAL for Docker + Cloudflare
    ),
)

# Import and register tools
from src.tools.read import register_read_tools
from src.tools.updates import register_update_tools

register_read_tools(mcp)
register_update_tools(mcp)

if __name__ == "__main__":
    app = mcp.streamable_http_app()
    uvicorn.run(app, host=HOST, port=PORT)
```

### json_store.py Pattern (Git Auto-Commit Storage)

All read/write servers use an identical storage layer:

```python
# Key behaviours:
# 1. Loads JSON from /app/data/[filename].json
# 2. Writes JSON with ensure_ascii=False (preserves Unicode/Chinese)
# 3. Auto-initializes Git repo in /app/data/ if not present
# 4. Configures git identity at repo level (NEVER --global)
# 5. Configures safe.directory for Synology NAS permissions
# 6. Sets GitHub remote via GITHUB_TOKEN + GITHUB_REPO env vars
# 7. Auto-commits on every write: "sync [filename].json from runtime"
# 8. Pushes to GitHub after commit (if remote configured)
```

### entrypoint.sh Pattern

```bash
#!/bin/bash
set -e

DATA_DIR="/app/data"
DEFAULTS_DIR="/app/data-defaults"  # read-only servers only

# Step 1: Initialize Git repo in /app/data
cd "$DATA_DIR"
if [ ! -d ".git" ]; then
    git init
    git config user.email "mcp-server@local"
    git config user.name "MCP Server"
fi

# Step 2: Configure GitHub remote (if env vars set)
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPO" ]; then
    REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
    git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"
    git fetch origin main --depth=1 2>/dev/null || true
    git checkout -B main 2>/dev/null || true
    git pull origin main --allow-unrelated-histories 2>/dev/null || true
fi

# Step 3: For read-only servers — sync defaults
if [ -d "$DEFAULTS_DIR" ]; then
    cp -f "$DEFAULTS_DIR"/*.json "$DATA_DIR/"
fi

# Step 4: Start server
exec python src/server.py
```

### Dockerfile Pattern

```dockerfile
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONPATH=/app

# Install git (required for json_store.py)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 80XX

ENTRYPOINT ["./entrypoint.sh"]
```

### docker-compose.yml Pattern

```yaml
version: "3.8"
services:
  mcp-[role]:
    build: .
    container_name: mcp-[role]
    ports:
      - "80XX:80XX"
    volumes:
      - /volume1/docker/mcp-[role]/data:/app/data
    environment:
      - HOST=0.0.0.0
      - PORT=80XX
      - PUID=1026
      - PGID=100
      - TZ=America/Vancouver
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - GITHUB_REPO=nicojan/mcp-[role]
    restart: unless-stopped
```

---

## Deployment Pipeline

### Initial Deployment (New Server)

1. **Build locally** — verify `python src/server.py` starts and tools respond
2. **Push to GitHub** — `nicojan/mcp-[role]`
3. **Create data directory on NAS** — `/volume1/docker/mcp-[role]/data/`
4. **Deploy via Portainer:**
   - Create new stack from `docker-compose.yml`
   - Set environment variables (GITHUB_TOKEN, GITHUB_REPO)
   - Deploy
5. **Configure Cloudflare Tunnel:**
   - Add public hostname: `mcp-[role].nicojan.com` (or `.forhuman.ca`)
   - Service: `http://192.168.50.200:80XX`
6. **Configure Cloudflare Access:**
   - Add application for the subdomain
   - Set authentication policy
7. **Connect to Claude:**
   - Add to Claude.ai MCP settings (URL + headers)
   - Add to Claude Code settings (if applicable)

### Updating a Running Server

1. Push changes to GitHub
2. In Portainer: pull image → rebuild container
3. Container restart triggers `entrypoint.sh` which pulls latest data from GitHub

### Data Recovery

- All data is in Git (local `/app/data/` + GitHub remote)
- On container restart, `entrypoint.sh` pulls from GitHub
- Manual recovery: SSH to NAS, cd to `/volume1/docker/mcp-[role]/data/`, `git log` / `git checkout`

---

## Networking

### Request Flow

```
Claude.ai/Code
    │
    │ HTTPS request to mcp-[role].nicojan.com/mcp/
    ▼
Cloudflare (DNS + CDN)
    │
    │ Cloudflare Access authentication check
    ▼
Cloudflare Tunnel (synology-main)
    │
    │ HTTP to 192.168.50.200:80XX
    ▼
Docker container (uvicorn on 0.0.0.0:80XX)
    │
    │ FastMCP Streamable HTTP transport
    ▼
Tool handler → json_store.py → /app/data/*.json
```

### Port Allocation

| Port | Server | Status |
|------|--------|--------|
| 8010 | mcp-builder-of-mcps | Deployed |
| 8011 | mcp-builder-of-decks | Deployed |
| 8012 | — | Available |
| 8013 | — | Available |
| 8014 | mcp-writer-for-human | Deployed |
| 8015 | mcp-designer-for-human | Deployed |
| 8016 | mcp-humanizer | Deployed |
| 8017 | mcp-writer-for-designer | Deployed |

---

## Critical Constraints

These are hard-won lessons documented across CLAUDE.md files. Violating any of these causes failures:

| Constraint | Reason |
|------------|--------|
| **NEVER** use `mcp.run()` | Blocks the event loop. Use `uvicorn.run(app, host, port)` instead |
| **NEVER** use `BaseHTTPMiddleware` | Corrupts MCP Streamable HTTP streams |
| **ALWAYS** disable DNS rebinding protection | Required for Docker + Cloudflare Tunnel routing |
| **ALWAYS** set `PYTHONPATH=/app` in Dockerfile | Python can't find `src/` modules otherwise |
| **ALWAYS** use `ensure_ascii=False` for JSON writes | Preserves Unicode (Traditional Chinese characters) |
| **NEVER** hardcode secrets | Use Portainer environment variables only |
| **NEVER** use `--global` for git config | Breaks container isolation; use repo-level config |
| **ALWAYS** configure `safe.directory` | Required for Synology NAS file permissions |
| Port range: `8000–8099` only | Convention enforced by mcp-builder-of-mcps |
| Naming: `mcp-[role]` | Consistent naming across repos, containers, subdomains |

---

## Monitoring and Maintenance

### Health Checks

- Each server responds to Streamable HTTP at `/mcp/`
- Cloudflare provides uptime monitoring via tunnel status
- Portainer shows container status and logs

### Daily Operations

- **4:00 AM daily restart** triggers `entrypoint.sh` → pulls latest data from GitHub
- Write operations auto-commit and push throughout the day
- No manual intervention needed for normal operations

### Troubleshooting

| Symptom | Check |
|---------|-------|
| Tool calls timeout | Portainer → container logs. Verify container is running. |
| "DNS rebinding" errors | Verify `enable_dns_rebinding_protection=False` in server.py |
| Git push failures | Check `GITHUB_TOKEN` hasn't expired. Check `GITHUB_REPO` is correct. |
| Data not persisting | Verify volume mount: `/volume1/docker/mcp-[role]/data:/app/data` |
| Import errors | Verify `PYTHONPATH=/app` in Dockerfile |
| Chinese characters garbled | Verify `ensure_ascii=False` in json_store.py |
