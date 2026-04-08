# Individual Server Specifications

---

## 1. mcp-builder-of-mcps

**Port:** 8010
**Subdomain:** `mcp-builder-of-mcps.nicojan.com`
**GitHub:** `nicojan/mcp-builder-of-mcps`
**Type:** Read + Write (infrastructure)

### Purpose

Scaffolding server that generates fully-deployable new MCP servers with zero guesswork. Serves templates, infrastructure config, port registry, planning docs, deployment checklists, and lessons learned. Every other server in this ecosystem was built using this one.

### Tools (13 total)

#### Read Tools (10)

| Tool | Description | Filters |
|------|-------------|---------|
| `get_infrastructure_config` | NAS, Portainer, Cloudflare, GitHub, git_identity config | `section` (nas, portainer, cloudflare, github, git_identity) |
| `get_port_registry` | Server catalog with ports, subdomains, status | `server_name`, `status` |
| `get_project_scaffold` | Directory tree + resolved metadata for a new server | `server_name`, `port`, `description` |
| `get_template` | Individual file template with placeholders resolved | `template_name` (11 options) |
| `get_all_templates` | All 11 templates in one call | — |
| `get_deployment_checklist` | Numbered steps with exact shell commands | — |
| `get_lessons_learned` | Deployment pitfalls by category | `category` (docker, git, fastmcp, github, claude) |
| `get_planning_doc_template` | Skeleton planning doc | `doc_type` (prd, data_schema, api_spec, deployment, claude_md) |
| `get_all_planning_docs` | All 5 planning docs in one call | — |

#### Write Tools (3)

| Tool | Description |
|------|-------------|
| `register_port` | Reserve port 8000–8099 with description |
| `update_port_entry` | Modify existing registry entry |
| `remove_port_entry` | Remove server from registry |

### Data Files (5 JSON)

| File | Size | Contents |
|------|------|----------|
| `infrastructure.json` | ~3KB | NAS config (DS1522+, 192.168.50.200), Portainer, Cloudflare, GitHub, git identity |
| `port_registry.json` | ~2KB | All MCP servers with ports, descriptions, subdomains, status |
| `templates.json` | 17KB | 11 code file templates with `{{placeholder}}` patterns |
| `planning_templates.json` | 8.1KB | 5 planning document skeletons (PRD, DATA_SCHEMA, API_SPEC, DEPLOYMENT, CLAUDE.md) |
| `lessons_learned.json` | 7.1KB | Categorized deployment lessons (docker, git, fastmcp, github, claude) |

### Available Templates (11)

| Template Name | Generates |
|---------------|-----------|
| `server_py` | `src/server.py` — FastMCP entry point |
| `json_store_py` | `src/storage/json_store.py` — Git auto-commit storage |
| `read_py` | `src/tools/read.py` — Read tool stubs |
| `updates_py` | `src/tools/updates.py` — Write tool stubs |
| `init_py` | `src/__init__.py` |
| `dockerfile` | `Dockerfile` — Python 3.12-slim, PYTHONPATH=/app |
| `docker-compose` | `docker-compose.yml` — Port mapping, volumes, env vars |
| `entrypoint_sh` | `entrypoint.sh` — Git init, GitHub sync, server start |
| `requirements_txt` | `requirements.txt` — FastMCP, uvicorn, pydantic, httpx |
| `gitignore` | `.gitignore` |
| `readme` | `README.md` |

### Build Sequence (for new servers)

1. `get_port_registry` — check available ports
2. `register_port` — claim port
3. `get_project_scaffold` — file manifest with resolved metadata
4. `get_planning_doc_template` x5 — PRD, DATA_SCHEMA, API_SPEC, DEPLOYMENT, CLAUDE.md
5. `get_template` x11 (or `get_all_templates`) — all code files
6. `get_lessons_learned` — review pitfalls before building
7. `get_deployment_checklist` — step-by-step deployment

---

## 2. mcp-builder-of-decks

**Port:** 8011
**Subdomain:** `mcp-builder-of-decks.nicojan.com`
**GitHub:** `nicojan/mcp-builder-of-decks`
**Type:** Read-only (reference library)

### Purpose

Reference library and toolkit for composing Slidev presentation decks. Provides a CSS utility system (4 layers), 15+ composition patterns as inline HTML, a design/workflow guide, and scaffold scripts. Includes a custom Slidev theme (`slidev-theme-apple-hig`) inspired by Apple's Human Interface Guidelines.

### Tools (4 total — all read-only)

| Tool | Description |
|------|-------------|
| `get_slide_system` | CSS class reference — 4 layers: tokens, grid, containers, utilities |
| `get_design_guide` | Creative brief, workflow, speaker notes format, Magic Move, quality checklist |
| `get_compositions` | 15+ content-driven HTML examples (statement, quote, big_number, comparison, cards, emoji_bullet, watermark, etc.) |
| `get_scaffold` | Setup scripts (1-setup.sh, 2-reset.sh, 3-present.sh) + theme installation |

### Data Files (3 JSON)

| File | Contents |
|------|----------|
| `slide_system.json` | CSS classes, spacing scale, grid system, containers, utility classes |
| `design_guide.json` | Workflow, palette derivation, speaker notes format, quality checklist |
| `compositions.json` | 15+ composition patterns with full HTML examples |

### Bundled Theme: slidev-theme-apple-hig

```
theme/
├── layouts/default.vue          Single canvas layout
├── components/
│   ├── LogoMark.vue             Brand logo component
│   ├── AccentBar.vue            Decorative accent bar
│   └── PdfExportButton.vue      PDF export button
├── styles/
│   ├── slide-system.css (23KB)  Full CSS utility system
│   ├── animations.css           Slide transitions
│   ├── print.css                Print/PDF styles
│   └── cjk.css                  CJK typography support
├── composables/
│   └── useThemeConfig.ts        Palette system + theme config
└── palettes/
    ├── hig.json                 Apple HIG palette
    └── human.json               Human brand palette
```

### Special Behaviour

- **No write tools** — purely a reference library
- Data synced from `/data-defaults/` into `/data/` on container startup via `entrypoint.sh`
- Scaffold directory (`/app/scaffold/`) contains deck project setup scripts

---

## 3. mcp-writer-for-human

**Port:** 8014
**Subdomain:** `mcp-writer-for-human.nicojan.com`
**GitHub:** `nicojan/mcp-writer-for-human`
**Type:** Read + Write (brand)

### Purpose

Linguistic style guide for **Human, an Education Collective**. Covers writing rules, tone calibration across 12 contexts, word choice, bilingual terminology (English + Traditional Chinese), formatting conventions, audience posture, and cross-language principles.

### Tools (12 total)

#### Read Tools (8)

| Tool | Description | Filters |
|------|-------------|---------|
| `get_style_for_task` | **Composite — start here.** Assembles brand identity, tone, word choice, audience, formatting, style rules, cross-language for a writing task | `task_context`, `language`, `audience` |
| `get_style_guide` | Complete style rules for a language | `language` (en, zh) |
| `get_tone_for_context` | Tone calibration for a writing context | `context` (12 options — see below) |
| `get_word_choice` | Preferred/avoided word pairs | `language` (en, zh) |
| `get_glossary` | Bilingual terminology lookup | `term`, `category` (core, pedagogy, service, education, brand) |
| `get_formatting_rules` | Bold, dashes, serial comma, numbers, headings, brand names | — |
| `get_cross_language_rules` | Bilingual content principles | — |
| `get_audience_posture` | Writing posture by audience | `audience` (parents, students) |

**12 Tone Contexts:** homepage, service_page, blog, email, social_media, brand_philosophy, progress_update, chat_message, feedback, student_direct, handout, slide

#### Write Tools (4)

| Tool | Description |
|------|-------------|
| `add_glossary_term` | Add bilingual glossary entry |
| `update_glossary_term` | Update existing glossary entry |
| `add_word_choice` | Add preferred/avoided word pair |
| `update_style_rule` | Update any section via dot-notation path |

### Data Files (9 JSON)

| File | Contents |
|------|----------|
| `brand_identity.json` | EN + ZH brand names, comma explanation (「人本，」), philosophy, mission, messaging |
| `english_style.json` | Voice, sentence/paragraph structure, pronouns, spelling, blog conventions |
| `chinese_style.json` | Traditional Chinese voice, grammar, punctuation, Chinese-specific conventions |
| `tone_calibration.json` | 12 writing contexts with register, description, example, guidance (EN + ZH) |
| `glossary.json` | Bilingual terminology with categories |
| `word_choice.json` | Preferred/avoided word pairs |
| `formatting.json` | Bold usage, dashes, serial comma, numbers, headings, brand name treatment |
| `cross_language.json` | Parallel structure, comma handling, bilingual layout, tone consistency, SEO |
| `audience.json` | Writing posture for parents and students (EN + ZH) |

### Companion Server

Paired with `mcp-designer-for-human` (8015). Writer owns language rules; Designer owns visual specs. Neither calls the other at runtime. Both share `brand_foundation` context.

---

## 4. mcp-designer-for-human

**Port:** 8015
**Subdomain:** `mcp-designer-for-human.forhuman.ca`
**GitHub:** `nicojan/mcp-designer-for-human`
**Type:** Read + Write (brand)

### Purpose

Complete visual design system for the **Human** brand. Covers colours (with semantic tokens and dark mode), typography (5 fonts, 11-step fluid scale, EN + ZH), spacing (9-step scale), 12 UI components, 11 behaviour patterns, icons (Material Symbols), accessibility standards (WCAG + Canadian legal), logo system, and imagery direction.

### Tools (24 total)

#### Read Tools (14)

| Tool | Description | Filters |
|------|-------------|---------|
| `get_visual_for_task` | **Composite — start here.** Assembles all visual data for a design task | `task_description` |
| `get_colour_palette` | Hex/RGB/HSL, roles, CSS vars, semantic tokens, data viz palette | `category` (primary, secondary, neutral, semantic, data_viz) |
| `get_contrast_ratios` | Pre-calculated WCAG pairings | `level` (aa_normal, aa_large, aaa_normal, aaa_large) |
| `get_typography` | 5 fonts, 11-step fluid scale, heading/body styles | `language` (en, zh, all) |
| `get_spacing` | 9-step scale (4px–128px), layout tokens, elevation, motion, touch targets, breakpoints, grids | `section` |
| `get_icon_system` | Material Symbols config + 14 curated brand icons | — |
| `get_accessibility_standards` | WCAG targets, Canadian legal context, 7 implementation principles | — |
| `get_brand_foundation` | Lightweight brand context (names, comma rules) | — |
| `get_logo_for_context` | Context-aware logo recommendation (10 contexts, 2 languages, 2 backgrounds) | `context`, `language`, `background` |
| `get_components` | 12 UI components (button, input, card, badge, modal, toast, navigation, table, avatar, tooltip, divider, skeleton) | `component_name` |
| `get_patterns` | 11 UI behaviour patterns (deference, loading, empty_state, error_recovery, etc.) | `pattern_name` |
| `get_content_patterns` | Content-in-UI conventions (bridge to Writer MCP) | — |
| `get_imagery` | Photography and illustration direction | — |
| `get_dark_mode` | Dark mode token overrides and adaptation rules | — |

#### Write Tools (10)

| Tool | Description |
|------|-------------|
| `add_colour` | Add colour to palette |
| `update_colour` | Update colour properties (auto-recalculates RGB/HSL on hex change) |
| `remove_colour` | Remove colour from palette |
| `add_brand_icon` | Add icon to brand set |
| `remove_brand_icon` | Remove icon from brand set |
| `update_semantic_token` | Update semantic token mapping (e.g., `--bg-primary` → `var(--cream-mid)`) |
| `update_typography_style` | Update heading or body style |
| `update_accessibility_rule` | Update accessibility principle rule |
| `update_spacing` | Update spacing values |
| `patch_visual_data` | Generic deep-merge on any data file (escape hatch) |

### Data Files (12 JSON)

| File | Contents |
|------|----------|
| `colour_palette.json` | Primary, secondary, neutral colors; semantic tokens; dark mode overrides |
| `contrast_ratios.json` | Pre-calculated WCAG pairings for all color combinations |
| `typography.json` | 5 fonts (Instrument Serif, Atkinson Hyperlegible Next, JetBrains Mono, Noto Serif TC, Noto Sans TC), 11-step scale |
| `spacing.json` | 9-step scale, layout tokens, elevation, motion, touch targets, breakpoints, grids |
| `icon_system.json` | Material Symbols config + 14 curated icons |
| `components.json` | 12 component definitions with variants, states, specs |
| `patterns.json` | 11 behaviour patterns with guidelines and examples |
| `accessibility.json` | WCAG standards, Canadian legal context, 7 principles |
| `brand_foundation.json` | Lightweight brand context |
| `logo_assets.json` | Logo specs for 10 contexts |
| `imagery.json` | Photography/illustration direction |
| `dark_mode.json` | (Part of colour_palette.json) Token overrides |

### Companion Server

Paired with `mcp-writer-for-human` (8014). Designer owns visual specs; Writer owns language rules. `get_content_patterns` bridges the two.

---

## 5. mcp-humanizer

**Port:** 8016
**Subdomain:** `mcp-humanizer.nicojan.com`
**GitHub:** `nicojan/mcp-humanizer`
**Type:** Read + Write (standalone)

### Purpose

Reference library for making AI-generated text sound naturally human. Organized across 5 linguistic dimensions: lexical patterns, structural patterns, sentiment/tone, discourse cohesion, and psycholinguistic texture. The server provides rules — Claude applies them during writing tasks.

### Tools (13 total, all prefixed `humanizer_`)

#### Read Tools (11)

| Tool | Description | Filters |
|------|-------------|---------|
| `humanizer_get_summary` | Lightweight: core principle + priority hierarchy + content profile | — |
| `humanizer_get_guide` | **Full composite** for major writing tasks — all dimensions | — |
| `humanizer_get_foundation` | Core principle, perplexity/burstiness axes, priority hierarchy | — |
| `humanizer_get_lexical_patterns` | Flagged words, substitutions, vocabulary rules | `risk_level` (high, medium, low) |
| `humanizer_get_structural_patterns` | Sentence length targets, syntax variety, punctuation, POS distribution | — |
| `humanizer_get_sentiment_tone` | Neutral bias, emotional layering, subjectivity | — |
| `humanizer_get_discourse_cohesion` | Transitions, markers, cohesive devices, repetition patterns | — |
| `humanizer_get_psycholinguistic_texture` | Cognitive load markers, self-monitoring, lexical retrieval, discourse planning | — |
| `humanizer_get_content_profile` | Per-content-type adjustments (academic, marketing, tech, prose) | — |
| `humanizer_get_anti_patterns` | Before/after AI→human rewrites | `category` (lexical, structural, sentiment, discourse, psycholinguistic) |
| `humanizer_get_caveats` | ESL sensitivity, detector brittleness, ethical considerations | — |

#### Write Tools (2)

| Tool | Description |
|------|-------------|
| `humanizer_update_rule` | Update any value in any data file via dot-notation path |
| `humanizer_add_anti_pattern` | Add before/after rewrite example |

### Data Files (9 JSON)

| File | Contents |
|------|----------|
| `foundation.json` | Core principle, perplexity/burstiness axes, priority hierarchy |
| `lexical_patterns.json` | Flagged words (verbs, adjectives, nouns, transitions, qualifiers), substitutions, vocabulary diversity |
| `structural_patterns.json` | Sentence length targets, syntactic variety, punctuation, POS distribution |
| `sentiment_tone.json` | Neutral bias, emotional layering, subjectivity, sensing/experience language |
| `discourse_cohesion.json` | Transitions, discourse markers, modal/epistemic markers, cohesive devices |
| `psycholinguistic_texture.json` | Cognitive load, self-monitoring, lexical retrieval, discourse planning |
| `content_profiles.json` | Per-content-type adjustments (academic, marketing, tech, prose) |
| `anti_patterns.json` | Before/after rewrite examples by category |
| `caveats.json` | ESL sensitivity, detector brittleness, ethical considerations |

### Tool Selection Guide

| Scenario | Tool |
|----------|------|
| Quick edit, polish existing text | `humanizer_get_summary` |
| New article, full rewrite | `humanizer_get_guide` |
| Specific dimension tuning | `humanizer_get_[dimension]` |
| Learning from examples | `humanizer_get_anti_patterns` |

---

## 6. mcp-writer-for-designer

**Port:** 8017
**Subdomain:** `mcp-writer-for-designer.nicojan.com`
**GitHub:** `nicojan/mcp-writer-for-designer`
**Type:** Read + Write (standalone)

### Purpose

Communication style guide for freelance UI/UX designers. Guidance on proposals, client meetings, feedback, scope changes, difficult conversations, and wrap-ups. Two audience modes: **design-literate** (peers, developers) and **non-designer** (clients, stakeholders).

### Tools (11 total)

#### Read Tools (9)

| Tool | Description | Filters |
|------|-------------|---------|
| `get_communication_guide` | **Composite** — assembles guide for context + audience | `context`, `audience_mode` |
| `get_core_principles` | 8 communication axioms | — |
| `get_audience_guidance` | Rules for design-literate vs. non-designer mode | — |
| `get_context_rules` | Rules for a communication situation | `context` (9 options — see below) |
| `get_vocabulary` | Design terms with plain-language equivalents | `mode` (design_literate, non_designer) |
| `get_antipatterns` | Habits to avoid | `context` |
| `get_summary` | Lightweight: principle names, context IDs, modes | — |
| `get_divergence_table` | Design-literate vs. non-designer comparison | — |
| `get_document_template` | Structural guide for document types | `template_type` (initial-proposal) |

**9 Communication Contexts:** discovery, proposal, client-meeting, async-update, feedback-request, feedback-response, scope-change, difficult-conversation, wrap-up

#### Write Tools (2)

| Tool | Description |
|------|-------------|
| `add_antipattern` | Add new anti-pattern entry to existing cluster |
| `update_vocabulary_term` | Update vocabulary term's plain-language equivalent |

### Data Files (5 JSON)

| File | Contents |
|------|----------|
| `principles.json` | 8 core communication principles with definitions and examples |
| `contexts.json` | 9 communication contexts with rules, format guidance, anti-patterns, mode divergence |
| `audiences.json` | Design-literate and non-designer audience profiles |
| `vocabulary.json` | Design terms with plain-language equivalents and mode flags |
| `document_templates.json` | Structural guides for document types (initial-proposal) |
