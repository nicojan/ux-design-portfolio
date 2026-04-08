# MCP Ecosystem Overview

## What This Is

Six custom MCP (Model Context Protocol) servers serving **Human, an Education Collective** (人本・共學社). All are JSON-backed reference libraries and curated data stores that Claude reads at inference time to produce brand-consistent, context-aware output.

None of these servers execute business logic. They serve structured data — style rules, visual specs, communication guides, presentation toolkits — so Claude can apply them during content creation, design, and communication tasks.

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────┐
│  Claude.ai / Claude Code                                     │
│  (MCP client — calls tools via Streamable HTTP)              │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTPS (Cloudflare Tunnel)
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Cloudflare Access                                           │
│  (Authentication layer — no app-level auth needed)           │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Synology DS1522+ NAS (192.168.50.200)                       │
│  Docker containers managed via Portainer                     │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ builder-of-mcps│  │builder-of-decks│  │writer-for-human│ │
│  │    :8010       │  │    :8011       │  │    :8014       │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │designer-for-   │  │   humanizer    │  │writer-for-     │ │
│  │  human :8015   │  │    :8016       │  │ designer :8017 │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                              │
│  Each container: Python 3.12 + FastMCP + uvicorn             │
│  Each /app/data: Git repo → auto-commits → GitHub sync      │
└──────────────────────────────────────────────────────────────┘
```

---

## Server Catalogue

| Server | Port | Subdomain | Purpose | Tools |
|--------|------|-----------|---------|-------|
| `mcp-builder-of-mcps` | 8010 | `mcp-builder-of-mcps.nicojan.com` | Scaffolding infra — generates new MCP servers | 10 read, 3 write |
| `mcp-builder-of-decks` | 8011 | `mcp-builder-of-decks.nicojan.com` | Slidev presentation toolkit + theme | 4 read-only |
| `mcp-writer-for-human` | 8014 | `mcp-writer-for-human.nicojan.com` | Linguistic style guide (EN + ZH) for Human brand | 8 read, 4 write |
| `mcp-designer-for-human` | 8015 | `mcp-designer-for-human.forhuman.ca` | Visual design system for Human brand | 14 read, 10 write |
| `mcp-humanizer` | 8016 | `mcp-humanizer.nicojan.com` | Human-sounding writing rules (psycholinguistic) | 11 read, 2 write |
| `mcp-writer-for-designer` | 8017 | `mcp-writer-for-designer.nicojan.com` | Communication style guide for freelance designers | 9 read, 2 write |

**Totals:** 6 servers, 67 tools (56 read + 11 write), 50+ JSON data files

---

## Ecosystem Relationships

```
INFRASTRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  mcp-builder-of-mcps (8010)
    Scaffolds new servers. Manages port registry,
    templates, infrastructure config, lessons learned.
    Every other server was built using this one.

HUMAN BRAND (forhuman.ca)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  mcp-writer-for-human (8014)  ←→  mcp-designer-for-human (8015)
    Writing layer                    Visual layer
    Voice, tone, glossary,           Colours, typography, spacing,
    word choice, formatting          components, patterns, icons,
    EN + Traditional Chinese         accessibility, dark mode

  Companion servers: mutually aware, don't call each other.
  Writer owns language rules. Designer owns visual specs.
  Both share brand_foundation context.

CONTENT QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  mcp-humanizer (8016)
    Standalone. Makes AI-generated text sound naturally
    human. Psycholinguistic, lexical, structural, and
    discourse-level rules. Works with any writing task.

PRESENTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  mcp-builder-of-decks (8011)
    Read-only reference library. CSS utility system,
    composition patterns, design guide, scaffold scripts
    for Slidev presentations. Includes custom Apple HIG
    inspired theme (slidev-theme-apple-hig).

CLIENT COMMUNICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  mcp-writer-for-designer (8017)
    Communication style for freelance UI/UX designers.
    Proposals, client meetings, feedback, scope changes,
    difficult conversations. Two audience modes:
    design-literate vs. non-designer.
```

---

## Shared Technology Stack

All 6 servers use identical technology:

| Layer | Technology |
|-------|-----------|
| Language | Python 3.12 |
| Framework | FastMCP 1.0.0+ |
| Server | uvicorn 0.30.0+ |
| Validation | Pydantic 2.0.0+ |
| Storage | JSON files in Git-tracked `/app/data/` |
| Transport | Streamable HTTP |
| Auth | Cloudflare Access (no app-level auth) |
| Container | Docker + docker-compose.yml |
| Orchestration | Portainer on Synology NAS |
| Networking | Cloudflare Tunnel (`synology-main`) |
| Version control | Git auto-commit → GitHub sync |

---

## Naming Convention

All servers follow the pattern: `mcp-[role]`

- Role describes what the server does, not what it is
- Examples: `builder-of-mcps`, `writer-for-human`, `designer-for-human`
- Port range: `8000–8099` (currently using `8010–8017`)

---

## Domains

| Domain | Used By |
|--------|---------|
| `nicojan.com` | Personal/infrastructure servers (builder-of-mcps, builder-of-decks, writer-for-human, humanizer, writer-for-designer) |
| `forhuman.ca` | Human brand servers (designer-for-human) |

---

## Data Governance Model

### Read-Only Servers
- **mcp-builder-of-decks** — No write tools. Data synced from `/data-defaults/` into `/data/` on container startup. Reference library only.

### Read + Write Servers
- All other 5 servers have write tools
- Every write operation auto-commits to the local Git repo in `/app/data/`
- If `GITHUB_TOKEN` + `GITHUB_REPO` env vars are set, changes push to GitHub automatically
- Git identity configured at repo level (never `--global`)

### Data Flow
```
Claude writes via tool  →  json_store.py updates file
                        →  Git auto-commit in /app/data/
                        →  Git push to GitHub (if configured)
                        →  On container restart: pull from GitHub
```

---

## Infrastructure Details

| Component | Value |
|-----------|-------|
| NAS Model | Synology DS1522+ |
| NAS IP | `192.168.50.200` |
| Docker Root | `/volume1/docker/` |
| Per-server data | `/volume1/docker/mcp-[name]/data/` |
| User/Group IDs | `PUID=1026`, `PGID=100` |
| Timezone | `America/Vancouver` |
| Portainer URL | `portainer.yujan.synology.me` |
| Cloudflare Tunnel | `synology-main` |
| GitHub Org | `nicojan` |
| Daily restart | 4:00 AM (triggers data sync from GitHub) |
