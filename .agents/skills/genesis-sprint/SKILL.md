---
name: genesis-sprint
description: >
  Agente Sprint do Genesis. Gera o backlog completo a partir da arquitetura, sequencia
  as tasks por dependência (bottom-up: data → backend → frontend), organiza em sprints,
  e executa cada sprint delegando para os agentes especialistas corretos. Motor de
  execução do framework — orquestra a construção real do software.
metadata:
  author: genesis-framework
  version: "1.0.0"
  role: sprint-orchestrator
  framework: genesis
---

## Tarefa

Gerar o backlog completo e executar cada sprint delegando tasks para os agentes especialistas. Execute os passos abaixo **na ordem**. Não pule tasks. Não avance para a próxima task sem testes passando na atual.

## Pré-condições obrigatórias

**Execute estas verificações antes de qualquer outra ação. Se uma falhar, PARE.**

```
1. .genesis/state.json existe?
   NÃO → PARE. Instrua: "Execute /genesis para iniciar o projeto do início."

2. .genesis/manifest.md existe?
   NÃO → PARE. Instrua: "Execute /genesis-intake para coletar os requisitos primeiro."

3. .genesis/architecture/system-design.md existe?
   NÃO → PARE. Instrua: "Execute /genesis-architect antes de planejar sprints."

4. state.json.phase é 'sprints' ou 'build'?
   NÃO (ex: 'intake', 'architecture') → PARE.
   Instrua: "A fase atual é '[phase]'. Complete /genesis-architect antes de continuar."
```

Apresente o resultado assim:

```
✅ manifest.md — encontrado
✅ system-design.md — encontrado
✅ state.json — phase: sprints — pronto para planejar
```

ou, em caso de falha:

```
🔴 Pré-condição não atendida: system-design.md não encontrado
→ Execute /genesis-architect para gerar a arquitetura antes de criar sprints.
   Ordem obrigatória: intake → scout (se brownfield) → architect → sprint
```

Não continue se qualquer verificação falhar.

---

## Leia antes de planejar

1. `.genesis/manifest.md` → features do produto
2. `.genesis/architecture/system-design.md` → módulos e dependências
3. `.genesis/contracts/openapi.yaml` → endpoints a implementar
4. `.genesis/contracts/db-schema.sql` → tabelas a criar
5. `.genesis/context/existing-code.md` → o que já existe (brownfield)
6. `.genesis/sprints/` → sprints anteriores (retomada)

---

## Fase 1 — Gerar o Backlog

### Regras de priorização

**Ordem obrigatória de implementação (bottom-up):**
```
1. Infraestrutura (Docker, env, CI/CD)
2. Banco de dados (migrations, schema)
3. Core domain (entidades principais, repositórios)
4. Auth e RBAC
5. API endpoints (por domínio, do mais fundamental ao mais complexo)
6. Workers/background jobs
7. Integrações externas
8. Frontend (por tela, do mais simples ao mais complexo)
9. E2E tests
10. Documentação final
```

**Nunca implemente frontend antes do endpoint estar funcionando.**
**Nunca implemente endpoint sem a migration correspondente.**

### Formato do backlog

`.genesis/sprints/backlog.md`:

```markdown
# Backlog — {project_name}
Gerado: {data}

## Sprint 1 — Fundação (~1 semana)

| # | Task | Agente | Dependências | Estimativa |
|---|------|--------|-------------|-----------|
| S1-01 | Docker Compose + variáveis de ambiente | genesis-devops | nenhuma | 2h |
| S1-02 | Migrations: tenants + users | genesis-data | S1-01 | 2h |
| S1-03 | Auth: JWT + login endpoint | genesis-backend | S1-02 | 3h |
| S1-04 | RBAC: require_role decorator | genesis-backend | S1-03 | 2h |
| S1-05 | Testes: auth + RBAC | genesis-qa | S1-04 | 2h |

## Sprint 2 — Core Domain (~1 semana)

| # | Task | Agente | Dependências | Estimativa |
|---|------|--------|-------------|-----------|
| S2-01 | Migration: {entidade principal} | genesis-data | S1-02 | 1h |
| S2-02 | CRUD: {entidade principal} | genesis-backend | S2-01 | 4h |
| S2-03 | Testes: CRUD + isolamento | genesis-qa | S2-02 | 2h |
| S2-04 | Tela lista {entidade} | genesis-frontend | S2-02 | 3h |
| S2-05 | Tela detalhe {entidade} | genesis-frontend | S2-04 | 2h |

## Sprint 3 — {Próxima feature}

[...]

## Backlog futuro (pós-MVP)

- {feature complexa 1}
- {feature complexa 2}
```

---

## Fase 2 — Executar Sprint

Para cada sprint selecionado, execute task por task:

```
┌─────────────────────────────────────────────────────┐
│  CICLO DE UMA TASK                                  │
│                                                     │
│  1. LER task no backlog                             │
│  2. VERIFICAR se já existe (grep/find)              │
│  3. MARCAR como 🔄 em progress.md                   │
│  4. IDENTIFICAR agente responsável                  │
│  5. EXECUTAR genesis-{agente} para a task           │
│  6. RODAR testes (obrigatório)                      │
│  7. SE testes passam → COMMITAR                     │
│  8. MARCAR como ✅ em progress.md                   │
│  9. PRÓXIMA task                                    │
│                                                     │
│  SE testes falham → corrigir, não pular             │
│  SE spec não cobre → perguntar ao usuário           │
└─────────────────────────────────────────────────────┘
```

### Mapa de agentes por tipo de task

| Tipo de task | Agente |
|-------------|--------|
| Docker, CI/CD, env | `genesis-devops` |
| Migration, schema, índices | `genesis-data` |
| API endpoint, service, repository | `genesis-backend` |
| Auth, JWT, RBAC | `genesis-backend` (foco auth) |
| Workers, jobs assíncronos | `genesis-backend` (foco async) |
| Telas, componentes, UI | `genesis-frontend` |
| Testes unit/integration | `genesis-qa` |
| E2E flows | `genesis-qa` |
| README, ADRs, docs | `genesis-docs` |

---

## Protocolo de commit por task

Após testes passando:

```bash
git add {arquivos específicos da task}
git commit -m "tipo(escopo): descrição concisa

- o que foi implementado
- testes: X passando

Refs: Genesis Sprint {N} — {task-id}"
```

**Tipos:** `feat`, `fix`, `test`, `refactor`, `docs`, `chore`

**Regras:**
- Nunca `git add .` ou `git add -A` — adicionar arquivos específicos
- Um commit por task
- Nunca commitar sem testes passando

---

## Progress Tracking

`.genesis/memory/progress.md`:

```markdown
# Progress — {project_name}

## Sprint 1 — Fundação

| Task | Status | Agente | Commit | Observação |
|------|--------|--------|--------|-----------|
| S1-01 Docker Compose | ✅ | genesis-devops | abc1234 | OK |
| S1-02 Migrations users | ✅ | genesis-data | def5678 | OK |
| S1-03 Auth JWT | 🔄 | genesis-backend | — | Em andamento |
| S1-04 RBAC | ⬜ | genesis-backend | — | Aguarda S1-03 |
| S1-05 Testes auth | ⬜ | genesis-qa | — | Aguarda S1-04 |

## Sprint 2 — Core Domain

| Task | Status | Agente | Commit | Observação |
|------|--------|--------|--------|-----------|
| S2-01 Migration {entidade} | ⬜ | genesis-data | — | — |
[...]
```

Legenda: ✅ Concluído | 🔄 Em andamento | ⬜ Pendente | 🔴 Bloqueado

---

## Protocolo anti-alucinação

Antes de implementar qualquer coisa, execute:

```bash
# "O arquivo já existe?"
find . -name "*{nome}*" -not -path "*/node_modules/*" -not -path "*/.git/*"

# "O endpoint já existe?"
grep -rn "{path}" src/ --include="*.py" --include="*.ts" --include="*.go"

# "O model já existe?"
grep -rn "class {Nome}\|type {Nome}" src/ --include="*.py" --include="*.ts"

# "A migration já foi criada?"
find . -path "*/migrations/*" -name "*{descricao}*"
```

**Se já existe → não reimplementar.** Verificar se está correto e seguir.
**Se existe mas está errado → corrigir, não reescrever do zero.**

---

## Comandos de teste por stack

### Python + pytest
```bash
pytest -x -q --tb=short -m "not e2e"
```

### Node + Jest
```bash
npm test -- --runInBand --testPathPattern="(?!e2e)"
```

### Go
```bash
go test ./... -v -run "Test" -short
```

### Java + Maven
```bash
mvn test -Dtest="!*E2E*"
```

### E2E (Playwright — somente em CI)
```bash
npx playwright test
```

**Regra de ouro: zero failures antes de commitar.**

---

## Quando parar e perguntar

Pare ANTES de agir quando:
- A task do backlog está ambígua para implementar
- Um teste existente falha e a causa não é óbvia
- A task depende de algo não planejado
- Uma decisão arquitetural nova é necessária
- O código existente conflita com o que foi especificado

---

## Retomando após interrupção

```
1. Ler .genesis/memory/progress.md
2. Encontrar última task com status 🔄 ou última ✅
3. Executar: git log --oneline -5
4. Verificar: git status
5. Se mudanças não commitadas com testes passando → commitar
6. Se mudanças não commitadas com testes falhando → diagnosticar
7. Continuar da task interrompida
```

---

## Ao concluir um sprint

1. Atualizar `.genesis/memory/progress.md` com todas as tasks ✅
2. Atualizar `.genesis/state.json`:
   - `current_sprint` → sprint + 1
3. Apresentar resumo:

```
✅ Sprint {N} concluído!
📋 Entregue:
  - {N} tasks implementadas
  - {N} testes passando
  - {N} endpoints novos
  - {N} telas implementadas (se frontend)
  - Commits: {lista de hashes}

Próximo sprint: {nome do sprint N+1}
```
