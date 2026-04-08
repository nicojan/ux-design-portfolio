# Building New MCP Servers

---

## Prerequisites

- Access to `mcp-builder-of-mcps` (port 8010)
- GitHub account (`nicojan`) with personal access token
- Portainer access on Synology NAS
- Cloudflare dashboard access for tunnel + access configuration

---

## End-to-End Process

### Phase 1: Planning

#### Step 1 — Check the Port Registry

Call `get_port_registry` to see what's deployed and what ports are available.

```
Available range: 8000–8099
Currently used: 8010, 8011, 8014, 8015, 8016, 8017
```

#### Step 2 — Reserve a Port

Call `register_port` with:
- `port`: available port number
- `server_name`: `mcp-[role]` (follow naming convention)
- `description`: what the server does
- `subdomain`: `mcp-[role].nicojan.com` or `mcp-[role].forhuman.ca`
- `status`: `planned`

#### Step 3 — Generate Planning Documents

Call `get_all_planning_docs` (or `get_planning_doc_template` x5) to get skeleton documents:

| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements — what the server does, who it serves, what tools it exposes |
| `DATA_SCHEMA.md` | JSON file structures — every data file's schema and field descriptions |
| `API_SPEC.md` | Tool specifications — every tool's parameters, return types, filters |
| `DEPLOYMENT.md` | NAS deployment specifics — port, volume, env vars, Cloudflare config |
| `CLAUDE.md` | Claude Code entry point — project structure, tech stack, constraints, build phases |

Fill out each document before writing code. These become the source of truth for the server.

#### Step 4 — Design the Data Model

Key decisions:
- **What JSON files?** One file per domain concept (e.g., `colours.json`, `typography.json`)
- **Read-only or read/write?** Reference libraries use `data-defaults/`; curated data uses write tools
- **Filters?** Design tools to accept filter parameters that reduce token usage
- **Composite tools?** Create "start here" tools that assemble data from multiple files for common tasks

### Phase 2: Scaffolding

#### Step 5 — Generate the File Manifest

Call `get_project_scaffold` with `server_name`, `port`, and `description` to get the complete directory tree with resolved metadata.

#### Step 6 — Generate Code Templates

Call `get_all_templates` to get all 11 file templates in one call. Each template has `{{placeholder}}` patterns resolved with your server's metadata.

| Template | Generates | Key Customization Points |
|----------|-----------|------------------------|
| `server_py` | `src/server.py` | Server name, port, tool imports |
| `json_store_py` | `src/storage/json_store.py` | Data directory path |
| `read_py` | `src/tools/read.py` | Read tool definitions |
| `updates_py` | `src/tools/updates.py` | Write tool definitions |
| `init_py` | `src/__init__.py` | — |
| `dockerfile` | `Dockerfile` | Port number |
| `docker-compose` | `docker-compose.yml` | Port, volume path, container name |
| `entrypoint_sh` | `entrypoint.sh` | Data sync behaviour |
| `requirements_txt` | `requirements.txt` | Additional dependencies |
| `gitignore` | `.gitignore` | — |
| `readme` | `README.md` | Server name, description |

#### Step 7 — Review Lessons Learned

Call `get_lessons_learned` to review deployment pitfalls by category:

| Category | Examples |
|----------|----------|
| `docker` | PYTHONPATH, safe.directory, git in containers |
| `git` | Repo-level config, auto-commit patterns, push auth |
| `fastmcp` | DNS rebinding, no BaseHTTPMiddleware, no mcp.run() |
| `github` | Token scopes, remote URL format, depth-1 fetch |
| `claude` | Tool description quality, filter design, token optimization |

### Phase 3: Implementation

#### Step 8 — Create Data Files

- Write JSON data files in `/data/`
- For read-only servers: also populate `/data-defaults/` with pristine copies
- Use `ensure_ascii=False` for any JSON containing non-ASCII characters

#### Step 9 — Implement Storage Layer

Start from the `json_store_py` template. Customization is rarely needed — the standard pattern handles:
- JSON read/write with Unicode preservation
- Git auto-commit on writes
- GitHub sync via environment variables
- Safe directory configuration for NAS

#### Step 10 — Implement Tools

Start from `read_py` and `updates_py` templates. Design principles:

**Read tools:**
- Include filter parameters to reduce response size (saves tokens)
- Create composite "start here" tools for common workflows
- Return structured dicts, not raw JSON strings

**Write tools:**
- Accept specific field values, not raw JSON blobs
- Auto-commit via json_store on every write
- Validate input before writing

**Tool descriptions:**
- Clear, actionable descriptions (Claude uses these to decide which tool to call)
- Mention filter parameters and their values in the description
- Mark composite tools with "start here" language

#### Step 11 — Implement Server Entry Point

Start from `server_py` template. The only customization is importing and registering your tools.

### Phase 4: Testing

#### Step 12 — Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run server locally
PYTHONPATH=. python src/server.py

# Test with curl (Streamable HTTP)
curl -X POST http://localhost:80XX/mcp/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

#### Step 13 — Docker Testing

```bash
docker build -t mcp-[role] .
docker run -p 80XX:80XX \
  -v $(pwd)/data:/app/data \
  -e HOST=0.0.0.0 \
  -e PORT=80XX \
  mcp-[role]
```

### Phase 5: Deployment

#### Step 14 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial commit — mcp-[role]"
git remote add origin https://github.com/nicojan/mcp-[role].git
git push -u origin main
```

#### Step 15 — Deploy to Synology via Portainer

1. Create directory: `/volume1/docker/mcp-[role]/data/`
2. In Portainer: create new stack
3. Paste `docker-compose.yml` content
4. Set environment variables:
   - `GITHUB_TOKEN` (personal access token)
   - `GITHUB_REPO` (`nicojan/mcp-[role]`)
5. Deploy stack

#### Step 16 — Configure Cloudflare

1. **Tunnel route:**
   - Hostname: `mcp-[role].nicojan.com`
   - Service: `http://192.168.50.200:80XX`
2. **Access application:**
   - Add application for the subdomain
   - Configure authentication policy

#### Step 17 — Connect to Claude

**Claude.ai:**
- Settings → MCP Servers → Add
- URL: `https://mcp-[role].nicojan.com/mcp/`
- Headers: Cloudflare Access headers

**Claude Code:**
- Add to project or user MCP settings

#### Step 18 — Update Port Registry

Call `update_port_entry` to set status from `planned` to `deployed`.

---

## Get Deployment Checklist

For the complete, copy-paste-ready version of these steps with exact shell commands, call `get_deployment_checklist` on `mcp-builder-of-mcps`.

---

## Design Conventions

### Tool Naming

| Pattern | Example | When |
|---------|---------|------|
| `get_[noun]` | `get_colour_palette` | Read single data source |
| `get_[noun]_for_[context]` | `get_visual_for_task` | Composite read |
| `add_[noun]` | `add_colour` | Create new entry |
| `update_[noun]` | `update_colour` | Modify existing entry |
| `remove_[noun]` | `remove_colour` | Delete entry |

### Filter Parameters

Every read tool should accept filter parameters where the full dataset is large:

```python
@mcp.tool()
def get_colour_palette(category: str | None = None) -> dict:
    """Get colour palette. Filter by category: primary, secondary, neutral, semantic, data_viz."""
    data = store.load("colour_palette")
    if category:
        return {category: data.get(category, {})}
    return data
```

### Composite Tools

For common workflows, create a composite tool that assembles data from multiple files:

```python
@mcp.tool()
def get_style_for_task(task_context: str, language: str = "en", audience: str | None = None) -> dict:
    """START HERE — assembles everything needed for a writing task."""
    return {
        "brand_identity": store.load("brand_identity"),
        "tone": get_tone_section(task_context),
        "word_choice": store.load("word_choice").get(language, {}),
        "audience": get_audience_section(audience) if audience else None,
        "formatting": store.load("formatting"),
        "style_rules": store.load(f"{language}_style" if language != "all" else "english_style"),
        "cross_language": store.load("cross_language"),
    }
```

### Data File Design

- One JSON file per domain concept
- Top-level keys are filterable categories
- Keep files under 25KB to avoid token waste
- Use semantic keys (not numeric IDs)
- Include metadata where helpful (last_updated, version)

---

## Common Pitfalls

Pulled from `get_lessons_learned` on mcp-builder-of-mcps:

| Pitfall | Fix |
|---------|-----|
| `ModuleNotFoundError: src` | Add `ENV PYTHONPATH=/app` to Dockerfile |
| Git "dubious ownership" | Configure `safe.directory` in entrypoint.sh |
| `mcp.run()` hangs forever | Use `uvicorn.run(app, host, port)` instead |
| BaseHTTPMiddleware breaks SSE | Never use it. Cloudflare Access handles auth. |
| DNS rebinding errors in Docker | Set `enable_dns_rebinding_protection=False` |
| Chinese characters escaped | Use `ensure_ascii=False` in all JSON writes |
| Git push fails silently | Verify GITHUB_TOKEN scope includes `repo` |
| Container can't reach GitHub | Verify NAS DNS resolution, check Synology firewall |
| Data overwrites on restart | Use `--allow-unrelated-histories` in entrypoint pull |
| Tool not appearing in Claude | Check tool description length and parameter types |
