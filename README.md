<div align="center">

<img src="docs/assets/genesis-banner.png" alt="Genesis Framework" width="100%" />

# Genesis Framework

**Construa software production-ready a partir de uma descrição.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/rafaeldourado9/genesis/releases)
[![npm](https://img.shields.io/npm/v/genesis-framework.svg)](https://www.npmjs.com/package/genesis-framework)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*Framework multi-agente que transforma uma descrição de projeto em arquitetura, código, testes e documentação — para qualquer linguagem, qualquer stack.*

[**Instalação →**](#instalação) · [**Como funciona →**](#como-funciona) · [**Agentes →**](#agentes)

</div>

---

## O Problema

Começar um projeto do jeito certo leva dias:
- Projetar a arquitetura e documentar decisões (ADRs)
- Escolher a stack certa com justificativas de trade-off
- Definir schema do banco, contratos de API, estratégia de testes
- Escrever boilerplate, Docker, CI/CD, README

**O Genesis faz tudo isso em uma sessão.**

---

## Instalação

Escolha o método mais conveniente para você.

### Método 1 — npx (recomendado, sem instalação prévia)

```bash
# Instalar no projeto atual
npx genesis-framework init

# Instalar em um diretório específico
npx genesis-framework init /caminho/do/projeto

# Instalar globalmente no Claude Code (qualquer projeto)
npx genesis-framework global
```

### Método 2 — npm global

```bash
npm install -g genesis-framework

# Depois use em qualquer lugar:
genesis-framework init
genesis-framework global
```

### Método 3 — One-liner (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeldourado9/genesis/main/scripts/install-remote.sh | bash
```

Com diretório específico:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeldourado9/genesis/main/scripts/install-remote.sh | bash -s -- /caminho/do/projeto
```

### Método 4 — One-liner (Windows PowerShell)

```powershell
iwr -useb https://raw.githubusercontent.com/rafaeldourado9/genesis/main/scripts/install-remote.ps1 | iex
```

### Método 5 — Manual (clone + script)

```bash
# Linux/macOS
git clone https://github.com/rafaeldourado9/genesis.git ~/tools/genesis
bash ~/tools/genesis/install.sh /caminho/do/projeto

# Windows
git clone https://github.com/rafaeldourado9/genesis.git D:\tools\genesis
D:\tools\genesis\install.ps1 -ProjectPath "C:\seu\projeto"
```

---

## Primeiros Passos

Após instalar, abra seu LLM preferido no projeto e digite:

```
/genesis
```

Isso é tudo. O Genesis assume o controle a partir daí.

> **Compatível com:** Claude Code · Cursor · Gemini CLI · Qualquer LLM com suporte a slash commands

---

## Instalação Global vs. Por Projeto

| | Por Projeto (`init`) | Global (`global`) |
|--|---------------------|-------------------|
| **Onde instala** | `.agents/skills/` no projeto | `~/.claude/commands/` |
| **Disponível em** | Apenas este projeto | Todos os projetos |
| **Estado persistente** | Sim (`.genesis/state.json`) | Não (adicionar `init` também) |
| **Quando usar** | Projeto específico, equipe | Uso pessoal, todos os projetos |

**Recomendação para uso pessoal:** rode `global` uma vez e pronto.

```bash
npx genesis-framework global
```

---

## Como Funciona

```
Você descreve o projeto
         ↓
genesis-intake    ──→  faz perguntas inteligentes, cria o manifest do projeto
genesis-scout     ──→  mapeia código existente (projetos brownfield)
genesis-architect ──→  diagramas C4, ADRs, matrizes de trade-off, stack técnica
genesis-data      ──→  diagrama ER, schema SQL, estratégia de índices, migrations
genesis-sprint    ──→  gera backlog, executa sprint por sprint
genesis-backend   ──→  API, services, repositories (adapta à sua linguagem)
genesis-frontend  ──→  componentes UI, estado, rotas (adapta ao seu framework)
genesis-qa        ──→  pirâmide de testes, BDD, cobertura
genesis-devops    ──→  Docker, pipelines CI/CD, monitoramento
genesis-guard     ──→  auditoria de conformidade antes do merge
genesis-docs      ──→  README, runbooks, catálogo de ADRs
```

**Um comando. Qualquer stack.**

---

## Demo

### Novo projeto do zero

```
> /genesis

Genesis: Olá! Vamos entender seu projeto.

1. Qual o nome e o que ele faz em uma frase?
> "TaskFlow — um quadro Kanban para times remotos com atualizações em tempo real"

2. Quem são os usuários? Quantos simultâneos no lançamento?
> "Times de 5 a 50 pessoas. ~100 simultâneos no lançamento, ~1000 no ano 1"

3. Tem preferência de tecnologia ou quer que eu recomende?
> "Recomende — quero mover rápido"

Genesis: Aqui está o que eu recomendo e por quê:
  Backend:  Python + FastAPI    (async, rápido, ótimo para tempo real)
  Banco:    PostgreSQL          (relacional, ACID, pgvector pronto)
  Cache:    Redis               (presença WebSocket, pub/sub)
  Frontend: React + Vite        (DX rápido, Zustand state, React Query)
  Deploy:   Docker + Compose    (simples, portátil, CI-ready)

Trade-offs documentados em .genesis/architecture/adrs/

Aprovar? (s/n)
> s

[genesis-architect]: Gerando design do sistema...
  ✅ Diagramas C4 Context + Container
  ✅ ADR-001: Escolha do banco (PostgreSQL vs MongoDB)
  ✅ ADR-002: Framework de API (FastAPI vs Django)
  ✅ ADR-003: Estratégia real-time (WebSocket vs SSE vs polling)
  ✅ Registro de patterns

[genesis-data]: Projetando schema...
  ✅ 8 tabelas, 12 índices, diagrama ER, estratégia de migration

[genesis-sprint]: Gerando backlog...
  ✅ 4 sprints, 28 tarefas, sequenciamento bottom-up

[genesis-sprint] Sprint 1 executando...
  ✅ S1-01: Docker Compose + env
  ✅ S1-02: Migrations: users, workspaces, boards
  ✅ S1-03: Auth: JWT + refresh tokens
  ✅ S1-04: RBAC: decorator require_role
  ✅ S1-05: Testes: 24 passando, 87% cobertura

Sprint 1 concluído. 3 restantes.
```

---

## Agentes

| Agente | Papel | Output |
|--------|-------|--------|
| `genesis` | Orquestrador | Gerenciamento de fase e estado |
| `genesis-intake` | Requisitos | `manifest.md` |
| `genesis-scout` | Mapeamento de código | `existing-code.md`, plano brownfield |
| `genesis-architect` | Arquitetura | C4, ADRs, trade-offs, patterns |
| `genesis-data` | Design de dados | Diagrama ER, schema SQL, migrations |
| `genesis-backend` | Camada de API | Services, repositories, OpenAPI |
| `genesis-frontend` | Camada de UI | Componentes, hooks, rotas |
| `genesis-qa` | Qualidade | Pirâmide de testes, BDD, E2E |
| `genesis-devops` | Infraestrutura | Docker, CI/CD, monitoramento |
| `genesis-sprint` | Execução | Backlog, orquestração de sprints |
| `genesis-docs` | Documentação | README, runbooks, catálogo ADR |
| `genesis-guard` | Conformidade | Relatório de auditoria pré-merge |
| `genesis-reviewer` | Code review | Bugs, anti-patterns, drift |

---

## Stacks Suportadas

O Genesis se adapta ao que você usa:

| Camada | Opções |
|--------|--------|
| **Backend** | Python (FastAPI, Django, Flask) · Node.js (NestJS, Express) · Go (Gin, Echo) · Java (Spring Boot) · Ruby (Rails) · PHP (Laravel) · Rust (Axum) |
| **Frontend** | React (Vite, Next.js) · Vue (Nuxt, Vite) · Angular · React Native (Expo) · Flutter · Svelte |
| **Banco** | PostgreSQL · MySQL · MongoDB · SQLite · DynamoDB · Firestore · Redis |
| **Deploy** | Docker Compose · Kubernetes · AWS (ECS, Lambda) · Railway · Render · Fly.io |
| **CI/CD** | GitHub Actions · GitLab CI · CircleCI · Jenkins |

---

## O que é Gerado

### Arquitetura
- Diagramas C4 Context e Container (Mermaid)
- ADRs para cada decisão significativa
- Matrizes de trade-off para escolhas técnicas
- Registro de patterns do projeto

### Dados
- Diagrama ER
- Schema SQL com constraints e índices
- Estratégia de migration com padrões zero-downtime

### Código
- Estrutura completa do projeto
- Contrato OpenAPI 3.0
- Camadas Service + Repository
- Auth + RBAC
- Dockerfile multi-stage + docker-compose
- Pipeline CI do GitHub Actions

### Testes
- Estratégia de pirâmide de testes
- Contratos Given-When-Then
- Testes unitários + integração + E2E
- Relatório de cobertura

### Documentação
- README profissional
- CONTRIBUTING.md
- Runbook de produção
- Catálogo de ADRs

---

## Estrutura de Output

Tudo que o Genesis gera vai para `.genesis/` — nunca toca seu código existente sem mostrar primeiro.

```
.genesis/
├── state.json              # Fase atual, stack, progresso
├── manifest.md             # Bíblia do projeto (imutável após intake)
├── context/
│   ├── surface.json        # Mapa do código existente (brownfield)
│   └── existing-code.md
├── architecture/
│   ├── system-design.md    # C4 + visão geral da arquitetura
│   ├── tech-stack.md       # Stack escolhida com justificativas
│   ├── patterns.md         # Convenções do projeto
│   └── adrs/               # Architecture Decision Records
│       ├── 001-database.md
│       └── ...
├── contracts/
│   ├── openapi.yaml        # Spec da API
│   ├── db-schema.sql       # Schema do banco
│   ├── er-diagram.md
│   └── test-contracts.md   # Specs Given-When-Then
├── sprints/
│   ├── backlog.md
│   └── sprint-001.md
└── memory/
    ├── progress.md         # Rastreamento de tarefas
    └── guard-report-*.md   # Relatórios de auditoria
```

---

## Princípios

1. **Spec antes de código** — arquitetura e contratos antes de qualquer implementação
2. **ADR-first** — toda decisão não-trivial tem um registro escrito
3. **Bottom-up** — dados → backend → frontend (nunca o contrário)
4. **Pirâmide de testes** — zero merge sem testes adequados
5. **Memória persistente** — sessões retomam de onde pararam
6. **Agnóstico de tecnologia** — adapta-se à sua stack, não ao contrário

---

## Compatibilidade

O Genesis é um conjunto de arquivos de skill para agentes de IA. Funciona com qualquer runtime que suporte o formato `.agents/skills/`:

- [Claude Code](https://claude.ai/code) (recomendado)
- [Cursor](https://cursor.sh)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- Qualquer LLM com suporte a slash commands customizados

---

## Roadmap

- [ ] `genesis-mobile` — agente dedicado para React Native + Expo
- [ ] `genesis-ml` — agente de pipeline ML (prep de dados, treino, serving)
- [ ] `genesis-migrate` — planejador de migration para projetos brownfield
- [ ] Interface web para gerenciamento de projetos e tracking de sprints
- [ ] Registro de agentes da comunidade
- [ ] Suporte a Cursor Rules (`.cursorrules`)

---

## Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md).

Ideias:
- Novos adapters de linguagem/framework para `genesis-backend` ou `genesis-frontend`
- Agentes de domínio específico (e-commerce, SaaS, IoT, pipelines ML)
- Exemplos de projetos reais usando Genesis
- Melhorias nos agentes existentes

---

## Licença

MIT — use, modifique, distribua, construa em cima.

---

<div align="center">

**Construído com Genesis · [Dê uma estrela](https://github.com/rafaeldourado9/genesis) se ajudou**

</div>
