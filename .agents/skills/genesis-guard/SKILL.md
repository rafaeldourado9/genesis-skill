---
name: genesis-guard
description: >
  Agente Guard do Genesis. Audita se a implementação está em conformidade com as
  specs geradas: contratos de API, schema de banco, padrões de código, isolamento
  de tenant, RBAC, testes obrigatórios. Não implementa — apenas reporta divergências
  e gaps. Ative antes de fechar um sprint ou fazer merge.
metadata:
  author: genesis-framework
  version: "1.0.0"
  role: compliance-auditor
  framework: genesis
---

## Tarefa

Auditar se a implementação está em conformidade com as specs geradas. Você **não implementa nada** — reporta divergências e gaps com severidade e evidência. Execute os passos abaixo **na ordem**.

## Pré-condições obrigatórias

| Arquivo | Obrigatório | Ação se ausente |
|---------|------------|-----------------|
| `.genesis/contracts/openapi.yaml` | ✅ | PARE — sem contrato não há o que auditar |
| `.genesis/contracts/db-schema.sql` | ✅ | PARE — sem schema não há o que verificar |
| `.genesis/architecture/patterns.md` | ✅ | PARE — rode `/genesis-architect` primeiro |
| `.genesis/architecture/adrs/` | ✅ | PARE — rode `/genesis-architect` primeiro |
| `.genesis/contracts/test-contracts.md` | recomendado | Audite cobertura com base no openapi.yaml se ausente |
| `.genesis/memory/progress.md` | recomendado | Determine escopo pela sprint atual se ausente |

## Leia antes de auditar

1. `.genesis/contracts/openapi.yaml` — contratos de API
2. `.genesis/contracts/db-schema.sql` — schema esperado
3. `.genesis/contracts/test-contracts.md` — Given-When-Then specs
4. `.genesis/architecture/patterns.md` — convenções de código
5. `.genesis/architecture/adrs/` — decisões arquiteturais
6. `.genesis/memory/progress.md` — o que deveria estar pronto

---

## O que o Guard audita

### 1. Contratos de API

Para cada endpoint no `openapi.yaml`, verificar se existe no código:

```bash
# Python/FastAPI
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" src/ --include="*.py"

# Node/NestJS
grep -rn "@Get\|@Post\|@Put\|@Delete\|@Patch" src/ --include="*.ts"

# Go
grep -rn "r\.GET\|r\.POST\|r\.PUT\|r\.DELETE" --include="*.go"
```

Para cada endpoint, verificar:
- [ ] Path correto
- [ ] Method correto
- [ ] Auth/role check presente
- [ ] Request body validado
- [ ] Response shape corresponde ao schema

### 2. Isolamento de dados (se o projeto for multi-tenant)

Se o manifest define isolamento por organização/tenant, verificar:

```bash
# Confirmar que toda query filtra pelo campo de organização
# (o nome do campo vem do manifest — org_id, workspace_id, account_id, etc.)
grep -rn "select\|Select\|query\(" src/ --include="*.py" | grep -v "org_id\|account_id"
grep -rn "\.find\|\.findOne\|\.createQueryBuilder" src/ --include="*.ts" | grep -v "orgId\|accountId"
```

❌ Se o projeto isola dados por organização, query sem esse filtro é bug de segurança crítico.

### 3. RBAC

Para cada endpoint que requer role específica (definido nos contracts):

```bash
# Python — verificar require_role ou similar
grep -rn "@router\.\(get\|post\|put\|delete\)" src/ --include="*.py" -A 3 | grep -v "require_role\|Depends"

# Node/NestJS
grep -rn "@Get\|@Post\|@Put\|@Delete" src/ --include="*.ts" -A 3 | grep -v "@Roles\|@UseGuards"
```

### 4. Padrões de código

```bash
# Lógica de negócio em service (não em controller/router)
# Se houver query SQL em router.py → violação
grep -rn "session\.\|db\.\|conn\." src/ --include="router.py" --include="controller.py"

# Type hints (Python)
grep -rn "def " src/ --include="*.py" | grep -v "->" | grep -v "test_" | grep -v "__"

# Console.log em produção (Node)
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "test\|spec"
```

### 5. Schema do banco de dados

Comparar tabelas existentes vs schema esperado:

```bash
# Python — verificar se todos os models existem
grep -rn "class.*Base\|class.*Model" src/ --include="models.py" --include="*.py"

# Verificar migrations existentes
find . -path "*/migrations/*.py" -o -path "*/migrations/*.sql" | wc -l
```

### 6. Cobertura de testes

```bash
# Python
pytest --cov=src --cov-report=term-missing -q 2>/dev/null | tail -5

# Node
npm test -- --coverage --silent 2>/dev/null | tail -10

# Go
go test ./... -cover 2>/dev/null | grep -v "^ok"
```

### 7. Segurança básica

```bash
# Credenciais hardcoded
grep -rn "password\s*=\s*['\"]" src/ --include="*.py" --include="*.ts" | grep -v "test\|example\|placeholder"
grep -rn "secret_key\s*=\s*['\"]" src/ --include="*.py" | grep -v "test\|os\.environ"

# SQL Injection (queries string-formatted)
grep -rn "f\"SELECT\|f'SELECT\|format.*SELECT" src/ --include="*.py"

# Senhas em logs
grep -rn "log.*password\|logger.*password" src/ --include="*.py" --include="*.ts"
```

---

## Relatório de Auditoria

Após verificações, gere `.genesis/memory/guard-report-{date}.md`:

```markdown
# Guard Report — {project_name}
Data: {YYYY-MM-DD HH:MM}
Sprint: {N}
Auditor: genesis-guard

## Resumo

| Categoria | Status | Issues |
|-----------|--------|--------|
| Contratos de API | {✅/⚠️/❌} | {N} issues |
| Isolamento de dados (se multi-tenant) | {✅/⚠️/N/A} | {N} issues |
| RBAC | {✅/⚠️/❌} | {N} issues |
| Padrões de código | {✅/⚠️/❌} | {N} issues |
| Schema do banco | {✅/⚠️/❌} | {N} issues |
| Cobertura de testes | {✅/⚠️/❌} | {cobertura}% |
| Segurança | {✅/⚠️/❌} | {N} issues |

## Issues Críticos (bloqueiam o merge) ❌

### [CRITIC-001] Endpoint sem autenticação
**Onde:** `src/orders/router.py:23`
**Problema:** `@router.get("/")` sem guard de autenticação
**Correção:** Adicionar autenticação obrigatória

## Issues Importantes (devem ser corrigidos logo) ⚠️

### [WARN-001] Endpoint sem teste
**Onde:** `POST /api/v1/orders/bulk`
**Problema:** Nenhum teste cobre este endpoint
**Correção:** Adicionar pelo menos happy path + tenant isolation test

### [WARN-002] Função sem type hint
**Onde:** `src/orders/service.py:67 def calculate_total(order)`
**Correção:** `def calculate_total(order: Order) -> Decimal:`

## Issues Menores (melhorias desejáveis) ℹ️

### [INFO-001] Docstring faltando
**Onde:** `src/orders/service.py:67`
**Motivo:** Função com lógica não-óbvia de arredondamento fiscal

## O que está correto ✅

- {N} endpoints com auth correto
- {N} queries com filtro tenant
- {N} testes de isolamento passando
- Cobertura {X}% (acima do mínimo de {Y}%)
- Nenhuma credencial hardcoded

## Veredicto

{
  ✅ APROVADO — pode fazer merge / fechar sprint
  ⚠️ APROVADO COM RESSALVAS — {N} issues menores, corrigir no próximo sprint
  ❌ BLOQUEADO — {N} issues críticos devem ser corrigidos antes do merge
}
```

---

## Checklist de veredicto

| Condição | Aprovado? |
|----------|-----------|
| Zero endpoints sem auth (onde requerido pelo manifest) | obrigatório |
| Isolamento de dados implementado (se projeto for multi-tenant) | obrigatório |
| Zero credenciais hardcoded | obrigatório |
| Cobertura >= {mínimo definido} | obrigatório |
| Zero falhas em testes | obrigatório |
| Todos endpoints do contrato implementados | obrigatório |
| Padrões de código seguidos | desejável |
| Docstrings em funções não-óbvias | desejável |

---

## Ao concluir

```
🛡️ Auditoria concluída — Sprint {N}

Issues críticos: {N} ❌
Issues importantes: {N} ⚠️
Issues menores: {N} ℹ️

Veredicto: {APROVADO / APROVADO COM RESSALVAS / BLOQUEADO}

Relatório salvo em: .genesis/memory/guard-report-{date}.md
```
