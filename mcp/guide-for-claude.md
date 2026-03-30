> **HOW TO USE THIS FILE**
>
> Drag and drop this file into a Claude project (Project Knowledge) or paste
> it into a chat. Then tell Claude what domain you want to build an MCP server
> for — your brand guidelines, design system, writing style, whatever — and
> it will walk you through the whole process.

# Build Your Own MCP Server

You are helping the user build a custom MCP (Model Context Protocol) server. MCP is an open standard from Anthropic that lets Claude call tools on external servers and pull back structured data — giving you persistent access to domain knowledge like brand guidelines, design systems, or style rules without the user pasting context into every conversation.

This document contains everything you need: the architecture pattern, project structure, code templates, deployment steps, and hard-won lessons from a production ecosystem of six MCP servers. Use it to guide the user from idea to deployed server.

## Your Role

Walk the user through building their MCP server step by step. Don't dump the whole process at once — work through it conversationally.

### Before writing any code, ask these questions:

**Domain discovery** — figure out what the server should know:

1. What domain of knowledge should this server own? (e.g., brand guidelines, writing style, design tokens, component library, communication rules)
2. Who will consume the data — Claude.ai, Claude Code, or both?
3. What does the user find themselves re-explaining or re-pasting most often? That's probably the best starting point.
4. Is the content in one language or multilingual?

**Data structure** — figure out what the JSON files should look like:

5. Can the user share examples of the rules, guidelines, or reference material they want to encode? Even a rough bullet list works.
6. Are there natural categories in the data? (e.g., "colours vs. typography vs. spacing" for a design system, or "tone vs. word choice vs. formatting" for a style guide)
7. Will Claude need the full dataset for every task, or just slices? (Almost always slices — this matters for tool design.)

**Infrastructure** — figure out where it will run:

8. Does the user have an always-on machine? (NAS, VPS, Raspberry Pi, Mac that stays on)
9. Are they comfortable with Docker, or do they need guidance on containerisation?
10. Do they need Claude.ai access (requires a public URL via tunnel) or just Claude Code on their local network?

You don't need answers to all of these upfront. Ask the first few, then let the conversation guide which follow-ups matter.

## Architecture Pattern

Every server in this ecosystem follows the same stack. Recommend this pattern unless the user has a strong reason to diverge:

- **Python 3.12** + FastMCP (`mcp` package) — https://gofastmcp.com
- **Streamable HTTP** transport (not stdio)
- **JSON data files** in a Git-tracked `/data` directory
- **Docker** container
- **Cloudflare Tunnel** for public access (free)
- **Cloudflare Access** for auth — no app-level auth code needed

Alternative frameworks if the user prefers TypeScript:
- `@modelcontextprotocol/sdk` — official SDK
- Any language that serves HTTP and returns JSON works, but FastMCP has the smoothest developer experience for Python

## Project Structure

Generate this structure for every new server. Replace `[name]` with the server's purpose (e.g., `mcp-style-guide`, `mcp-design-tokens`):

```
mcp-[name]/
├── CLAUDE.md              # Context file for Claude Code sessions
├── docs/
│   ├── PRD.md             # Product requirements
│   ├── DATA_SCHEMA.md     # JSON data file schemas
│   ├── API_SPEC.md        # Tool specs
│   └── DEPLOYMENT.md      # Deployment runbook
├── src/
│   ├── __init__.py
│   ├── server.py          # FastMCP entry point
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── read.py        # Read-only tools
│   │   └── updates.py     # Write tools (auto-commits to Git)
│   └── storage/
│       ├── __init__.py
│       └── json_store.py  # JSON I/O + Git commit helper
├── data/
│   └── *.json             # Domain data files
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh          # Startup script — seeds data, initialises Git
├── requirements.txt
└── .gitignore
```

## Build Sequence

Guide the user through these phases in order. Confirm each phase works before moving on.

### Phase 1: Data Design

This is the most important phase. Get the data right and everything else follows.

- Help the user structure their domain knowledge into JSON files
- One file per concern (e.g., `colours.json`, `typography.json`, `tone.json`)
- Ask: "If Claude needed to write in your brand voice, what rules would you give it?" Then turn those answers into structured JSON
- Use `ensure_ascii=False` for non-ASCII content (Chinese, accented characters, etc.)

Example data file:

```json
{
  "brand_colours": {
    "primary": { "hex": "#2D5A3D", "role": "primary", "usage": "Headlines, CTAs, key UI elements" },
    "secondary": { "hex": "#8B6F47", "role": "secondary", "usage": "Accents, supporting elements" }
  }
}
```

### Phase 2: Tool Design

The most important design principle: **tools should return the minimum data Claude needs**. Never build a `get_everything` tool. Build focused tools with filter parameters.

- **Read tools** go in `src/tools/read.py` — these are the majority of tools
- **Write tools** go in `src/tools/updates.py` — for adding/updating data, must auto-commit to Git
- Every tool should accept optional filter parameters

Template for a read tool:

```python
from mcp.server.fastmcp import FastMCP
from src.storage.json_store import load_json


def register_read_tools(mcp: FastMCP):
    @mcp.tool()
    async def get_colours(role: str | None = None) -> dict:
        """Get brand colours, optionally filtered by role."""
        colours = load_json("colours.json")
        if role:
            return {k: v for k, v in colours.items()
                    if v.get("role") == role}
        return colours
```

Suggest a **composite tool** (like `get_style_for_task` or `get_visual_for_task`) that assembles data from multiple JSON files for common tasks. This saves the user from making five tool calls when one will do.

### Phase 3: Server Infrastructure

Use this `server.py` template:

```python
import os
import uvicorn
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

from src.storage.json_store import init_storage
from src.tools.read import register_read_tools
from src.tools.updates import register_write_tools

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))

mcp = FastMCP(
    "[server-name]",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=False,
    ),
)

init_storage()
register_read_tools(mcp)
register_write_tools(mcp)

if __name__ == "__main__":
    app = mcp.streamable_http_app()
    uvicorn.run(app, host=HOST, port=PORT)
```

Use this `json_store.py` template for the storage layer:

```python
import json
import subprocess
from pathlib import Path

DATA_DIR = Path("/app/data")


def init_storage() -> None:
    """Initialise data directory and Git repo. Call once at startup."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not (DATA_DIR / ".git").exists():
        subprocess.run(["git", "init"], cwd=DATA_DIR, capture_output=True)
    subprocess.run(
        ["git", "config", "user.name", "[server-name]"],
        cwd=DATA_DIR, capture_output=True,
    )
    subprocess.run(
        ["git", "config", "user.email", "[server-name]@localhost"],
        cwd=DATA_DIR, capture_output=True,
    )
    # Required when running as a mapped user in Docker
    subprocess.run(
        ["git", "config", "safe.directory", str(DATA_DIR)],
        cwd=DATA_DIR, capture_output=True,
    )


def load_json(filename: str) -> dict:
    path = DATA_DIR / filename
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(filename: str, data: dict, message: str) -> None:
    path = DATA_DIR / filename
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    subprocess.run(["git", "add", "."], cwd=DATA_DIR, capture_output=True)
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=DATA_DIR, capture_output=True, text=True,
    )
    if result.stdout.strip():
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=DATA_DIR, capture_output=True,
        )
```

### Phase 4: Containerisation

Dockerfile:

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY data/ ./data-defaults/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV PYTHONPATH=/app
ENTRYPOINT ["./entrypoint.sh"]
```

docker-compose.yml (adjust port and paths):

```yaml
services:
  mcp-server:
    build: .
    restart: unless-stopped
    environment:
      - PORT=8080
      - HOST=0.0.0.0
      - TZ=UTC
      # Optional: enable GitHub push from write tools
      # - GITHUB_TOKEN=${GITHUB_TOKEN}
      # - GITHUB_REPO=your-org/mcp-server-name
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    # Uncomment for NAS — match your system's user/group IDs
    # user: "1000:1000"
```

requirements.txt:

```
mcp>=1.9.0
uvicorn>=0.34.0
httpx>=0.28.0
pydantic>=2.11.0
```

entrypoint.sh:

```bash
#!/bin/bash
set -e

# Seed data directory from defaults if files are missing
for f in /app/data-defaults/*.json; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  [ -f "/app/data/$base" ] || cp "$f" "/app/data/$base"
done

# Git initialisation is handled by init_storage() in Python —
# it runs inside /app/data so the repo persists through the bind mount.

exec python src/server.py
```

Make sure `entrypoint.sh` is executable (`chmod +x entrypoint.sh`).

`.gitignore`:

```
__pycache__/
*.pyc
*.pyo
.env
.venv/
venv/
*.egg-info/
dist/
build/
data/.git/
.DS_Store
.pytest_cache/
```

### Phase 5: Connect to Claude

- **Claude.ai / Desktop**: Settings → Connectors → Add custom connector. URL is the server's public endpoint (e.g., `https://your-server.example.com/mcp`)
- **Claude Code**: Add the server to project settings with streamable HTTP transport
- **Local development**: Run `python src/server.py` and connect Claude Code to `http://localhost:8080/mcp`

Ask the user which Claude interface they use and tailor the connection instructions.

### Phase 6: Deployment (if needed)

If the user needs a public URL:

1. Set up Cloudflare Tunnel (free) pointing to the Docker container's port
2. Add Cloudflare Access policy to restrict who can reach the server
3. No app-level auth needed — Cloudflare handles it

If local-only, skip this — Claude Code can connect to `localhost` directly.

## Critical Rules

Follow these without exception. They come from production experience.

### Never

- Use `mcp.run()` — use `uvicorn.run()` with `streamable_http_app()`. The `mcp.run()` method doesn't support streamable HTTP properly.
- Use `BaseHTTPMiddleware` with FastMCP — it silently corrupts MCP streaming. You'll get intermittent failures that are very hard to debug.
- Pass unsupported kwargs to `FastMCP()` — check the FastMCP docs for valid parameters.
- Hardcode secrets in any committed file — use environment variables.
- Use `--global` for git config in Docker — use repo-level config only.

### Always

- Disable DNS rebinding protection via `TransportSecuritySettings` when running behind a reverse proxy or tunnel.
- Set `PYTHONPATH=/app` in the Dockerfile — without it, Python can't find modules in `src/` and the error message won't point you to the cause.
- Use `ensure_ascii=False` in `json.dumps()` — otherwise non-ASCII characters become `\u` escape sequences.
- Git-track the `/data` directory — you get version history, rollback, and a sync mechanism for free.
- Initialise Git inside `/data`, not in the project root — this ensures the Git history persists through the Docker bind mount.
- Set `git config safe.directory` inside Docker — required when the container runs as a mapped user (e.g., `1000:1000`).
- Prefix tool names when building multiple servers (e.g., `style_get_rules` vs `design_get_colours`) to avoid name collisions.
- Use Pydantic `BaseModel` with `Field()` for tool input validation.
- Use `httpx` (async) instead of `requests` (sync) for any HTTP calls.
- Strip `meta` blocks from JSON responses to save tokens.

## Naming Convention

All servers follow `mcp-[purpose]` naming (e.g., `mcp-style-guide`, `mcp-design-tokens`, `mcp-slides`). Suggest a name based on the user's domain.

## References

- MCP spec: https://modelcontextprotocol.io
- FastMCP docs: https://gofastmcp.com
- MCP quickstart: https://modelcontextprotocol.io/quickstart
- Figma Console MCP (good first MCP to try): https://github.com/southleft/figma-console-mcp
- Claude Code docs: https://docs.anthropic.com/en/docs/claude-code
