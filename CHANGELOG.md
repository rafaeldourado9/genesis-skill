# Changelog

All notable changes to Genesis Framework are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [1.1.0] — 2026-06-02

### Added

**Instalação universal via npm:**
- `package.json` — pacote `genesis-framework` publicável no npm
- `bin/genesis.js` — CLI Node.js sem dependências externas
  - `npx genesis-framework init` — instala no projeto atual (Windows/Linux/macOS)
  - `npx genesis-framework global` — instala globalmente em `~/.claude/commands/`
  - `npx genesis-framework update` — atualiza skills existentes (alias de `init --force`)
  - Flags: `--force`, `--global`, `--path`

**Scripts de instalação remota (sem clonar o repositório):**
- `scripts/install-remote.sh` — one-liner para Linux/macOS via `curl | bash`
- `scripts/install-remote.ps1` — one-liner para Windows via PowerShell `iwr | iex`
- Ambos detectam Node.js e usam `npx` como método primário com fallback para `curl+tar` e `git clone`

**README reescrito em português:**
- 5 métodos de instalação documentados com exemplos
- Tabela de comparação instalação global vs por projeto
- Demo completo em PT-BR
- Badges npm adicionados

### Changed

- `README.md` reescrito completamente em português
- `.npmignore` adicionado para controlar o que entra no pacote npm

---

## [1.0.0] — 2026-06-01

### Added

**13 specialized agents:**

- `genesis` — Main orchestrator with greenfield and brownfield support
- `genesis-intake` — Progressive requirements elicitation with smart questions
- `genesis-scout` — Existing codebase mapper for brownfield projects
- `genesis-architect` — C4 diagrams, ADRs, trade-off matrices, tech stack selection
- `genesis-data` — ER diagram, SQL schema, index strategy, migration guide
- `genesis-backend` — API implementation adapting to Python/Node/Go/Java and more
- `genesis-frontend` — UI implementation adapting to React/Vue/RN/Flutter and more
- `genesis-qa` — Test pyramid strategy, BDD scenarios, E2E, coverage
- `genesis-devops` — Docker, CI/CD pipelines, environments, monitoring
- `genesis-sprint` — Backlog generation and bottom-up sprint execution
- `genesis-docs` — README, runbooks, ADR catalog, docstrings
- `genesis-guard` — Pre-merge compliance auditor
- `genesis-reviewer` — Code review for bugs, anti-patterns, architectural drift

**Installation:**
- `install.ps1` — Windows PowerShell installer
- `install.sh` — Linux/macOS bash installer

**Project state persistence:**
- `.genesis/state.json` — phase tracking across sessions
- `.genesis/manifest.md` — immutable project bible after intake
- `.genesis/architecture/` — ADRs, C4, patterns, tradeoffs
- `.genesis/contracts/` — OpenAPI, schema, test contracts
- `.genesis/memory/` — progress tracking, guard reports

**Supported stacks at launch:**
- Backend: Python (FastAPI, Django), Node.js (NestJS, Express), Go (Gin), Java (Spring Boot)
- Frontend: React (Vite, Next.js), Vue, Angular, React Native, Flutter
- Database: PostgreSQL, MySQL, MongoDB, SQLite, DynamoDB
- Deploy: Docker Compose, Kubernetes, AWS, Railway, Render

---

## Planned for [1.1.0]

- [ ] Elixir + Phoenix adapter
- [ ] Bun + Hono adapter
- [ ] SvelteKit adapter
- [ ] `genesis-mobile` dedicated agent for React Native + Expo
- [ ] NPX installer: `npx genesis-init my-project`

## Planned for [2.0.0]

- [ ] `genesis-ml` — ML pipeline agent
- [ ] `genesis-migrate` — brownfield database migration planner
- [ ] Community agent registry
- [ ] Web dashboard for project/sprint management
