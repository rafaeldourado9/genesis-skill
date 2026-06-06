---
name: genesis-scout
description: >
  Agente Scout do Genesis. Mapeia projetos existentes antes de qualquer geração de código.
  Entende o que já foi construído — linguagens, frameworks, estrutura, padrões, endpoints,
  modelos, testes, CI/CD. Alimenta o genesis-architect com contexto real para que nada
  seja duplicado ou sobrescrito por engano.
metadata:
  author: genesis-framework
  version: "1.0.0"
  role: scout
  framework: genesis
---

## Tarefa

Mapear o projeto existente e produzir dois arquivos: `.genesis/context/surface.json` e `.genesis/context/existing-code.md`. Execute os passos abaixo **na ordem**.

## Regra absoluta

**Nunca modifique arquivos existentes do projeto.**
Leia, analise e escreva SOMENTE em `.genesis/context/`.

## Parar e perguntar quando

- Detectar múltiplos backends com stacks diferentes (qual é o principal?)
- Encontrar padrões conflitantes sem convenção clara (qual seguir?)
- Haver ambiguidade sobre o que é "feature completa" vs "rascunho"

---

## O que o Scout mapeia

### 1. Superfície do projeto

```bash
# Detectar linguagens e frameworks
ls -la / dir
cat package.json 2>/dev/null | jq '{name, version, dependencies, devDependencies}'
cat pyproject.toml 2>/dev/null
cat go.mod 2>/dev/null
cat pom.xml 2>/dev/null
cat Cargo.toml 2>/dev/null
cat composer.json 2>/dev/null

# Detectar estrutura de pastas
find . -maxdepth 3 -type d | grep -v node_modules | grep -v .git | grep -v __pycache__

# Detectar Docker
ls docker-compose*.yml Dockerfile* 2>/dev/null
```

### 2. Backend — endpoints e serviços

**Python/FastAPI:**
```bash
grep -rn "@router\.\|@app\." --include="*.py" | grep "def "
grep -rn "class.*Model\|class.*Schema\|class.*Base" --include="*.py"
```

**Python/Django:**
```bash
grep -rn "urlpatterns\|path(" --include="urls.py"
grep -rn "class.*View\|class.*Serializer\|class.*Model" --include="*.py"
```

**Node/NestJS:**
```bash
grep -rn "@Controller\|@Get\|@Post\|@Put\|@Delete\|@Patch" --include="*.ts"
grep -rn "@Entity\|@Schema\|class.*Dto" --include="*.ts"
```

**Node/Express:**
```bash
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" --include="*.js" --include="*.ts"
```

**Go:**
```bash
grep -rn "func.*Handler\|r\.GET\|r\.POST\|r\.PUT\|r\.DELETE" --include="*.go"
```

### 3. Frontend — estrutura e componentes

```bash
# React/Next.js
find . -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | head -50
grep -rn "export default\|export const.*=" --include="*.tsx" | grep "Page\|Component\|Layout"

# Vue
find . -name "*.vue" | grep -v node_modules | head -50

# Rotas
grep -rn "Route\|path:" --include="*.tsx" --include="*.ts" --include="App.*"
```

### 4. Banco de dados

```bash
# Migrations
find . -name "*.sql" -o -path "*/migrations/*.py" -o -path "*/migrations/*.ts" | head -30
find . -name "schema.prisma" -o -name "schema.rb" | head -5
grep -rn "class.*Model\|CREATE TABLE\|@Entity" --include="*.py" --include="*.ts" --include="*.sql" | head -30
```

### 5. Testes existentes

```bash
find . -path "*/test*" -o -path "*spec*" | grep -v node_modules | head -30
# Contar testes
grep -rn "def test_\|it(\|test(\|describe(" --include="*.py" --include="*.ts" --include="*.spec.*" | wc -l
```

### 6. CI/CD e infraestrutura

```bash
ls .github/workflows/ .gitlab-ci.yml Jenkinsfile 2>/dev/null
cat docker-compose.yml 2>/dev/null
ls k8s/ kubernetes/ helm/ 2>/dev/null
```

---

## Output: surface.json

Após mapear, escreva `.genesis/context/surface.json`:

```json
{
  "scanned_at": "ISO8601",
  "project_type": "monorepo|backend-only|fullstack|frontend-only|library|cli",
  "languages": ["python", "typescript"],
  "frameworks": {
    "backend": "fastapi|django|nestjs|express|gin|spring|none",
    "frontend": "react|vue|angular|next|nuxt|none",
    "orm": "sqlalchemy|django-orm|prisma|typeorm|gorm|none",
    "testing": ["pytest", "jest", "vitest"]
  },
  "structure": {
    "backend_root": "api/|src/|backend/|app/",
    "frontend_root": "frontend/|web/|client/|app/",
    "tests_root": "tests/|test/|__tests__/"
  },
  "existing": {
    "endpoints_count": 0,
    "models_count": 0,
    "components_count": 0,
    "tests_count": 0,
    "migrations_count": 0
  },
  "patterns_detected": [
    "repository-pattern",
    "service-layer",
    "dto-pattern",
    "event-driven"
  ],
  "docker": true,
  "ci_cd": "github-actions|gitlab-ci|jenkins|none",
  "env_vars": ["DATABASE_URL", "SECRET_KEY"]
}
```

---

## Output: existing-code.md

Escreva `.genesis/context/existing-code.md` com um resumo legível:

```markdown
# Código Existente — {project_name}
Mapeado: {data}

## Stack Detectada
- **Backend:** {linguagem} + {framework}
- **Frontend:** {framework ou "não detectado"}
- **Banco:** {inferido de models/migrations}
- **Testes:** {frameworks} — {N} testes encontrados
- **CI/CD:** {pipeline detectado ou "nenhum"}

## Estrutura de Pastas
```
{árvore de pastas relevante}
```

## Endpoints Existentes
| Method | Path | Arquivo |
|--------|------|---------|
| GET | /api/users | api/routes/users.py:12 |
[...]

## Models/Entidades Existentes
| Model | Campos principais | Arquivo |
|-------|------------------|---------|
| User | id, email, role | models/user.py |
[...]

## Componentes Frontend (se houver)
| Componente | Tipo | Arquivo |
|-----------|------|---------|
| LoginPage | Page | src/pages/Login.tsx |
[...]

## Padrões Identificados
- {padrão}: {onde é usado}

## Gaps Detectados (🔴 LACUNAS)
- {o que parece incompleto ou faltando}

## Pontos de Atenção
- {qualquer coisa incomum, dívida técnica, inconsistência}
```

---

## Verificação de conclusão

Antes de atualizar state.json, confirme:

- [ ] `.genesis/context/surface.json` existe e tem os campos: `scanned_at`, `project_type`, `languages`, `frameworks`, `existing`
- [ ] `.genesis/context/existing-code.md` existe com endpoints, models e padrões listados
- [ ] Todos os gaps e pontos de atenção estão documentados em `existing-code.md`

## Após mapear

1. Apresente resumo ao usuário:

```
🔍 Scout concluído!

Encontrei:
- {N} endpoints em {linguagem/framework}
- {N} models/entidades
- {N} testes ({cobertura estimada}%)
- Stack: {backend} + {frontend} + {banco}

Padrões detectados: {lista}
Gaps detectados: {lista}

O genesis-architect vai usar esse mapeamento para não duplicar nada
e propor apenas o que está faltando.
```

2. Atualize `.genesis/state.json`:
   - `phase` → `"architecture"`
   - `existing_code_summary` → resumo em 2 linhas
   - Adicione `"scout"` em `completed_phases`
   - `mode` → `"brownfield"` (ou `"feature-addition"` se for feature específica)

3. Informe: "✅ Mapeamento concluído. Pronto para genesis-architect."
