# Changelog

Todas as mudanças notáveis do Genesis Framework são documentadas aqui.

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

---

## [1.1.1] — 2026-06-02

### Corrigido

- Comandos `npx` corrigidos de `npx genesis-framework` para `npx github:rafaeldourado9/genesis-skill` (pacote ainda não publicado no npm)
- Nome do repositório corrigido em todos os arquivos: `genesis` → `genesis-skill`

### Melhorado

- `CONTRIBUTING.md` traduzido para português
- `examples/README.md` traduzido para português
- Templates de issue e pull request do GitHub traduzidos para português
- Histórico de commits limpo (removido Co-Authored-By dos commits anteriores)

---

## [1.1.0] — 2026-06-02

### Adicionado

**Instalação universal via npm:**
- `package.json` — pacote `genesis-framework` publicável no npm
- `bin/genesis.js` — CLI Node.js sem dependências externas
  - `npx github:rafaeldourado9/genesis-skill init` — instala no projeto atual (Windows/Linux/macOS)
  - `npx github:rafaeldourado9/genesis-skill global` — instala globalmente em `~/.claude/commands/`
  - `npx github:rafaeldourado9/genesis-skill update` — atualiza skills existentes (alias de `init --force`)
  - Flags: `--force`, `--global`, `--path`

**Scripts de instalação remota (sem clonar o repositório):**
- `scripts/install-remote.sh` — one-liner para Linux/macOS via `curl | bash`
- `scripts/install-remote.ps1` — one-liner para Windows via PowerShell `iwr | iex`
- Ambos detectam Node.js e usam `npx` como método primário com fallback para `curl+tar` e `git clone`

**README reescrito em português:**
- 5 métodos de instalação documentados com exemplos
- Tabela de comparação: instalação global vs por projeto
- Demo completo em PT-BR
- Badges npm adicionados

### Alterado

- `README.md` reescrito completamente em português
- `.npmignore` adicionado para controlar o que entra no pacote npm

---

## [1.0.0] — 2026-06-01

### Adicionado

**13 agentes especializados:**

- `genesis` — Orquestrador principal com suporte a projetos greenfield e brownfield
- `genesis-intake` — Coleta progressiva de requisitos com perguntas inteligentes
- `genesis-scout` — Mapeamento de código existente para projetos brownfield
- `genesis-architect` — Diagramas C4, ADRs, matrizes de trade-off, seleção de stack técnica
- `genesis-data` — Diagrama ER, schema SQL, estratégia de índices, guia de migrations
- `genesis-backend` — Implementação de API adaptando-se a Python/Node/Go/Java e mais
- `genesis-frontend` — Implementação de UI adaptando-se a React/Vue/RN/Flutter e mais
- `genesis-qa` — Pirâmide de testes, cenários BDD, E2E, cobertura
- `genesis-devops` — Docker, pipelines CI/CD, ambientes, monitoramento
- `genesis-sprint` — Geração de backlog e execução de sprints bottom-up
- `genesis-docs` — README, runbooks, catálogo de ADRs, docstrings
- `genesis-guard` — Auditor de conformidade pré-merge
- `genesis-reviewer` — Code review para bugs, anti-patterns e drift arquitetural

**Instalação:**
- `install.ps1` — Instalador PowerShell para Windows
- `install.sh` — Instalador bash para Linux/macOS

**Persistência de estado do projeto:**
- `.genesis/state.json` — rastreamento de fase entre sessões
- `.genesis/manifest.md` — bíblia imutável do projeto após o intake
- `.genesis/architecture/` — ADRs, C4, patterns, trade-offs
- `.genesis/contracts/` — OpenAPI, schema, contratos de testes
- `.genesis/memory/` — rastreamento de progresso, relatórios do guard

**Stacks suportadas no lançamento:**
- Backend: Python (FastAPI, Django), Node.js (NestJS, Express), Go (Gin), Java (Spring Boot)
- Frontend: React (Vite, Next.js), Vue, Angular, React Native, Flutter
- Banco: PostgreSQL, MySQL, MongoDB, SQLite, DynamoDB
- Deploy: Docker Compose, Kubernetes, AWS, Railway, Render

---

## Roadmap

### [1.2.0]
- [ ] Adapter Elixir + Phoenix
- [ ] Adapter Bun + Hono
- [ ] Adapter SvelteKit
- [ ] Agente `genesis-mobile` dedicado para React Native + Expo

### [2.0.0]
- [ ] Agente `genesis-ml` — pipeline de ML
- [ ] Agente `genesis-migrate` — planejador de migration para projetos brownfield
- [ ] Registro de agentes da comunidade
- [ ] Dashboard web para gerenciamento de projetos e sprints
