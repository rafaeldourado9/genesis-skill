<div align="center">

<img src="docs/assets/genesis-banner.png" alt="Genesis Framework" width="100%" />

# Genesis Framework

**Construa software production-ready a partir de uma descrição.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/rafaeldourado9/genesis-skill/releases)
[![npm](https://img.shields.io/npm/v/genesis-framework.svg)](https://www.npmjs.com/package/genesis-framework)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*Framework multi-agente que transforma uma descrição de projeto em arquitetura, código, testes e documentação — para qualquer linguagem, qualquer stack.*

[**Instalação →**](#instalação) · [**CLI →**](#genesis-run--cli-de-orquestração) · [**Como funciona →**](#como-funciona) · [**Agentes →**](#agentes)

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

### Método 1 — npx via GitHub (recomendado, sem instalação prévia)

```bash
# Instalar no projeto atual
npx github:rafaeldourado9/genesis-skill init

# Instalar em um diretório específico
npx github:rafaeldourado9/genesis-skill init /caminho/do/projeto

# Instalar globalmente no Claude Code, Codex e OpenCode
npx github:rafaeldourado9/genesis-skill global
```

### Método 2 — npm global

```bash
npm install -g github:rafaeldourado9/genesis-skill

# Depois use em qualquer lugar:
genesis-framework init
genesis-framework global
```

### Método 3 — One-liner (Linux/macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeldourado9/genesis-skill/main/scripts/install-remote.sh | bash
```

Com diretório específico:

```bash
curl -fsSL https://raw.githubusercontent.com/rafaeldourado9/genesis-skill/main/scripts/install-remote.sh | bash -s -- /caminho/do/projeto
```

### Método 4 — One-liner (Windows PowerShell)

```powershell
iwr -useb https://raw.githubusercontent.com/rafaeldourado9/genesis-skill/main/scripts/install-remote.ps1 | iex
```

### Método 5 — Manual (clone + script)

```bash
# Linux/macOS
git clone https://github.com/rafaeldourado9/genesis-skill.git ~/tools/genesis
bash ~/tools/genesis/install.sh /caminho/do/projeto

# Windows
git clone https://github.com/rafaeldourado9/genesis-skill.git D:\tools\genesis
D:\tools\genesis\install.ps1 -ProjectPath "C:\seu\projeto"
```

---

## Primeiros Passos

Após instalar, use a ativação nativa do seu agente:

| Agente | Ativação |
|--------|----------|
| Claude Code | `/genesis` |
| OpenCode | `/genesis` |
| Codex | `$genesis` ou `/skills` → `genesis` |

O instalador cria automaticamente os adapters de cada runtime.

> **Compatível com:** Claude Code · Codex · OpenCode

---

## Instalação Global vs. Por Projeto

| | Por Projeto (`init`) | Global (`global`) |
|--|---------------------|-------------------|
| **Onde instala** | `.agents/skills/`, `.claude/skills/`, `.opencode/` | Pastas globais dos três agentes |
| **Disponível em** | Apenas este projeto | Todos os projetos |
| **Estado persistente** | Sim (`.genesis/state.json`) | Não (adicionar `init` também) |
| **Quando usar** | Projeto específico, equipe | Uso pessoal, todos os projetos |

**Recomendação para uso pessoal:** rode `global` uma vez e reinicie sessões abertas dos agentes.

```bash
npx genesis-framework global
```

---

## `genesis-run` — CLI de Orquestração

O `genesis-run` é um CLI separado para quem quer usar os agentes do Genesis **fora de um editor** ou **em scripts/pipelines**. Ele gerencia chaves de API com segurança, roteia tarefas para o modelo certo, rastreia tokens e atualiza o `progress.md` automaticamente.

> **Requer:** Node.js 18+ · `npm install -g github:rafaeldourado9/genesis-skill`

---

### Setup inicial

Execute uma vez para configurar suas chaves e budget de tokens:

```bash
genesis-run setup
```

Você será guiado por um prompt interativo que aceita até 5 providers. As chaves ficam cifradas em `~/.genesis/vault.json` (AES-256-GCM + PBKDF2).

Em ambientes CI/CD, use variáveis de ambiente — elas sempre têm prioridade sobre o vault:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AIza...
export GENESIS_VAULT_PASSPHRASE=senha-do-vault   # para usar o vault em CI
```

---

### Gerenciar chaves

```bash
genesis-run keys list              # listar nomes das chaves salvas
genesis-run keys set NOME valor    # adicionar ou atualizar uma chave
genesis-run keys delete NOME       # remover uma chave
```

---

### Executar uma tarefa

```bash
genesis-run run "descrição da tarefa"
```

O CLI detecta automaticamente o domínio e complexidade da tarefa e escolhe o tier e modelo mais adequado:

| Tier detectado | Modelo padrão | Quando usa |
|---------------|---------------|------------|
| `junior` | claude-haiku | Tarefa simples, < 25 palavras, sem keywords complexas |
| `pleno` | claude-sonnet | Padrão — tarefa de desenvolvimento normal |
| `senior` | claude-opus | Keywords arquiteturais, alta complexidade, > 120 palavras |
| `backend` | claude-sonnet | Detecção de: api, endpoint, service, migration... |
| `frontend` | claude-sonnet | Detecção de: component, tela, css, react, vue... |
| `qa` | claude-sonnet | Detecção de: test, spec, coverage, mock, e2e... |
| `architect` | claude-opus | Detecção de: arquitetura, adr, c4, microservice... |

**Opções:**

```bash
genesis-run run "tarefa" --tier senior          # forçar um tier específico
genesis-run run "tarefa" --provider openai      # forçar provider
genesis-run run "tarefa" --model gpt-4o         # forçar modelo exato
genesis-run run "tarefa" --no-cache             # ignorar cache para esta chamada
genesis-run run "tarefa" --label "nome da task" # rótulo no progress.md
```

**Aliases de modelo disponíveis:**

| Alias | Modelo real |
|-------|------------|
| `claude-haiku` | claude-haiku-4-5-20251001 |
| `claude-sonnet` | claude-sonnet-4-6 |
| `claude-opus` | claude-opus-4-8 |
| `gpt-mini` | gpt-4o-mini |
| `gpt` | gpt-4o |
| `gemini-flash` | gemini-1.5-flash |
| `gemini-pro` | gemini-1.5-pro |

---

### Rodar em múltiplos LLMs em paralelo

```bash
genesis-run parallel "revise esta decisão arquitetural" --providers anthropic,openai

genesis-run parallel "gere testes para este endpoint" --providers anthropic,gemini,openai
```

O resultado de cada provider é exibido separadamente. Útil para comparar respostas ou obter redundância.

---

### Status e monitoramento de tokens

```bash
genesis-run status
```

Exemplo de output:

```
Tokens — 2026-06-06
Budget  : 500.000
Usado   : 87.340 (17%)  [███░░░░░░░░░░░░░░░░░]

Por modelo:
  anthropic/claude-sonnet-4-6          78.200 tok  (12 calls)  | cache_read: 12.400
  openai/gpt-4o                         9.140 tok   (3 calls)

Última chamada: implementar endpoint de auth  14:22:07

Cache: 8 entradas  24 KB
Tasks pendentes: 3
  ⬜ Implementar RBAC
  ⬜ Testes de integração
  ⬜ Deploy Docker
```

O CLI emite alertas automáticos no stderr quando o uso atinge 80%, 90% e 95% do budget:

```
🟡 AVISO: 80% do budget de tokens usado
🔴 ALERTA: 90% do budget de tokens usado
⛔ CRITICO: 95% do budget de tokens usado (487.500 / 500.000)
```

---

### Cache

```bash
genesis-run cache stats    # ver tamanho e número de entradas
genesis-run cache clear    # limpar todo o cache
```

O cache armazena respostas por 1 hora. Prompts idênticos (mesmo provider + modelo + mensagem) não consomem tokens — retornam instantaneamente.

---

### Budget de tokens

```bash
genesis-run budget set 1000000    # definir budget para 1M tokens/dia
genesis-run budget reset          # reiniciar contagem da sessão
```

O budget é diário — reinicia automaticamente à meia-noite.

---

### Otimizações automáticas

| Técnica | Como funciona |
|---------|--------------|
| **Cache SHA-256** | Respostas idênticas são reutilizadas sem chamada à API |
| **Request coalescing** | Múltiplas tarefas enviadas em < 80ms são batched em uma única chamada |
| **Prompt caching** | Para Claude, o system prompt é enviado com `cache_control: ephemeral` — tokens de cache são 10× mais baratos |
| **Tier routing** | Tarefas simples vão para modelos menores (haiku) — reduz custo sem sacrificar qualidade |

---

### Segurança do vault

As chaves de API nunca ficam em texto plano no disco:

- Cifradas com **AES-256-GCM** (cifra autenticada — detecta adulteração)
- Chave derivada com **PBKDF2 / SHA-256 / 120.000 iterações + salt aleatório de 256 bits**
- Arquivo `~/.genesis/vault.json` com **permissão 0600** (só o dono lê)
- **Echo suprimido** durante digitação da senha no terminal
- **Variáveis de ambiente têm prioridade** — vault nunca é consultado se a env var existir

> A chave fica em memória apenas durante o processo. Um atacante com acesso físico ao arquivo `vault.json` e sem a senha **não consegue extrair as chaves**.

---

### Referência rápida

```
genesis-run setup                          Configurar chaves e budget
genesis-run keys list|set|delete           Gerenciar chaves no vault
genesis-run run "tarefa" [opcoes]          Executar com roteamento automático
genesis-run parallel "tarefa" --providers  Rodar em múltiplos LLMs em paralelo
genesis-run status                         Ver tokens, cache e tasks pendentes
genesis-run cache clear|stats              Gerenciar cache
genesis-run budget set <n> | reset         Definir/reiniciar budget de tokens
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
genesis-inspector ──→  segurança frontend, mapa de telas/botões/bugs, sprint de fix
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
| `genesis-inspector` | Segurança UI + integração | Mapa de telas/botões/bugs, sprint de fix |

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
5. **Memória persistente** — sessões retomam de onde pararam; o `progress.md` registra timestamps de cada sprint executado
6. **Agnóstico de tecnologia** — adapta-se à sua stack, não ao contrário

---

## Limitações conhecidas

### genesis-scout em codebases grandes

O `genesis-scout` mapeia projetos brownfield antes da geração de código. Em repos grandes (>50 mil linhas) há algumas limitações práticas:

- **Janela de contexto:** o scout lê amostras representativas, não o código completo — pode perder padrões que aparecem apenas em arquivos pouco amostrados.
- **Módulos não convencionais:** estruturas que desviam muito do padrão (ex: monorepos complexos, workspaces Yarn com múltiplos apps) podem exigir hints manuais.
- **Gerado vs. escrito à mão:** código gerado por ORMs ou codegen pode inflar as métricas do mapa. O scout tenta detectar e sinalizar esses arquivos.
- **Recomendação:** em repos grandes, forneça ao scout o caminho dos módulos principais (`src/`, `app/`, `packages/core/`) em vez de apontar para a raiz.

Essas limitações são conhecidas e fazem parte do roadmap de melhoria.

---

## Compatibilidade

O Genesis instala integrações nativas para:

- Claude Code: `.claude/skills/`, com `/genesis`
- Codex: `.agents/skills/`, com `$genesis` ou `/skills`
- OpenCode: `.opencode/skills/` e `.opencode/commands/`, com `/genesis`

---

## Roadmap

### v1.4 — Instalação multi-runtime ✅

- [x] Instalação automática no Claude Code, Codex e OpenCode
- [x] Comando `/genesis` no Claude Code e OpenCode
- [x] Ativação `$genesis`, `/skills` e `/prompts:genesis` no Codex
- [x] Instalação global e por projeto com o mesmo CLI
- [x] Testes automatizados dos adapters de cada runtime

### v1.5 — CLI de orquestração + qualidade de prompts (atual)

- [x] `genesis-run` — CLI multi-LLM com vault seguro (AES-256-GCM)
- [x] Roteamento automático de tarefas por tier e domínio
- [x] Suporte a Claude, OpenAI e Gemini em paralelo
- [x] Cache SHA-256, request coalescing, prompt caching
- [x] Rastreamento de tokens por modelo com alertas de budget
- [x] Atualização automática de `progress.md` ao final de cada task
- [x] SKILL.md reescritos no estilo prescritivo (compatível com qualquer LLM)
- [x] Plano de capacidade no intake + teto de complexidade no architect (anti-overengineering)
- [x] Validação pós-instalação e schema de `state.json`

### v1.6 — Brownfield e domínios específicos (próximo)

- [ ] `genesis-migrate` — planejador de migration para projetos brownfield complexos
- [ ] Melhorar `genesis-scout` para codebases >50k linhas (amostragem dirigida)
- [ ] `genesis-mobile` — agente dedicado para React Native + Expo
- [ ] `genesis-ml` — agente de pipeline ML (prep de dados, treino, serving)

### v2.0 — Plataforma (longo prazo)

- [ ] Interface web para tracking de sprints e progresso
- [ ] `genesis-run` em Go — binário único, sem Node.js como dependência
- [ ] Registro de agentes da comunidade (terceiros)
- [ ] Suporte a Cursor Rules (`.cursorrules`)

> Quer influenciar a ordem? Abra uma issue com o label `roadmap`.

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

**Construído com Genesis · [Dê uma estrela](https://github.com/rafaeldourado9/genesis-skill) se ajudou**

</div>
