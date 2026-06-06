---
name: genesis-docs
description: >
  Agente de Documentação do Genesis. Gera e mantém toda a documentação do projeto:
  README, ADR catalog, OpenAPI docs, guias de contribuição, runbooks de produção,
  changelog. Documenta o PORQUÊ, não o QUÊ. Sincroniza documentação com código.
metadata:
  author: genesis-framework
  version: "1.0.0"
  role: tech-writer
  framework: genesis
---

## Tarefa

Gerar e manter a documentação completa do projeto. Execute os passos abaixo **na ordem**. Documente o PORQUÊ, não o QUÊ — o código já descreve o que faz; o que falta é o raciocínio por trás das decisões.

## Pré-condições obrigatórias

| Arquivo | Obrigatório | Ação se ausente |
|---------|------------|-----------------|
| `.genesis/manifest.md` | ✅ | PARE — rode `/genesis-intake` primeiro |
| `.genesis/architecture/tech-stack.md` | ✅ | PARE — rode `/genesis-architect` primeiro |
| `.genesis/architecture/adrs/` | ✅ | PARE — ADRs são a base do PORQUÊ |
| `.genesis/memory/progress.md` | recomendado | Sem progress.md, documente o que conseguir inferir do código |

## O que você produz

### 1. README.md (raiz do projeto)

```markdown
# {project_name}

> {one-liner description}

## O que é

{2-3 parágrafos explicando o problema que resolve e como resolve.
Sem jargão técnico. Escrito para alguém que nunca viu o projeto.}

## Quick Start

```bash
# Clone
git clone {repo_url}
cd {project}

# Configurar ambiente
cp .env.example .env
# editar .env com suas credenciais

# Subir com Docker
docker compose up --watch

# Rodar migrations
make migrate

# Verificar saúde
curl http://localhost:8000/health
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura](docs/architecture/system-design.md) | C4 diagrams, tech stack |
| [ADRs](docs/architecture/adrs/) | Decisões arquiteturais |
| [API](docs/contracts/openapi.yaml) | Contratos de API |
| [Banco de dados](docs/contracts/er-diagram.md) | Schema e ER diagram |
| [Contribuindo](CONTRIBUTING.md) | Como contribuir |
| [Runbook](docs/runbook.md) | Operações em produção |

## Desenvolvimento

```bash
make dev      # Subir serviços
make test     # Rodar testes
make lint     # Linting + type check
make migrate  # Rodar migrations
```

## Arquitetura

{Descrição de 2 parágrafos da arquitetura. Referenciar system-design.md.}

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | {linguagem + framework} |
| Banco | {banco} |
| Cache | {redis ou N/A} |
| Frontend | {framework ou N/A} |
| Deploy | {docker/k8s/etc} |

## License

{MIT / Apache 2.0 / Proprietary}
```

### 2. CONTRIBUTING.md

```markdown
# Contribuindo com {project_name}

## Workflow

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/nome-da-feature`
3. Faça suas mudanças
4. Rode os testes: `make test`
5. Rode o lint: `make lint`
6. Commit seguindo o padrão: `feat(escopo): descrição`
7. Abra um Pull Request

## Padrões de commit

```
feat(users): adicionar endpoint de convite
fix(auth): corrigir refresh token expirado
test(orders): adicionar teste de isolamento por usuário
docs(adr): documentar decisão de banco de dados
refactor(service): simplificar validação de tenant
```

## Padrões de código

Consulte `.genesis/architecture/patterns.md` para convenções detalhadas.

- Lógica de negócio em `services/` — nunca em controllers
- Type hints em todo código Python
- Testes obrigatórios para toda feature nova
- Nenhum `print()` / `console.log()` em código de produção
- Nenhuma credencial hardcoded

## Rodando testes

```bash
make test          # Todos os testes (exceto E2E)
make test-e2e      # Apenas testes E2E
make test-cov      # Com relatório de cobertura
```
```

### 3. Runbook de Produção (`docs/runbook.md`)

```markdown
# Runbook — {project_name}

> Guia operacional para produção. Leia antes de fazer qualquer mudança em prod.

## Health checks

```bash
# Verificar saúde dos serviços
curl https://api.{domain}/health

# Verificar banco
docker compose exec db pg_isready -U ${DB_USER}

# Verificar redis
docker compose exec redis redis-cli ping
```

## Deploy

```bash
# Pull e restart (zero-downtime com 2+ réplicas)
git pull origin main
docker compose pull api
docker compose up -d --no-deps api

# Verificar logs após deploy
docker compose logs -f api --tail=50
```

## Migrations em produção

```bash
# SEMPRE fazer backup antes de migrar
make backup-db

# Rodar migration
docker compose exec api alembic upgrade head

# Verificar status
docker compose exec api alembic current
```

## Troubleshooting

### API retornando 500
1. Verificar logs: `docker compose logs api --tail=100`
2. Verificar conexão DB: `docker compose exec api python -c "from src.{project}.infrastructure.database import engine; print('ok')"`
3. Verificar variáveis de ambiente: `docker compose exec api env | grep -v PASSWORD`

### Banco de dados lento
1. Verificar queries lentas: `SELECT * FROM pg_stat_activity WHERE wait_event IS NOT NULL;`
2. Verificar índices faltantes: `SELECT * FROM pg_stat_user_tables ORDER BY seq_scan DESC;`

### Redis cheio
1. Verificar uso: `docker compose exec redis redis-cli INFO memory`
2. Limpar cache específico: `docker compose exec redis redis-cli DEL {key_pattern}`

## Backup e restore

```bash
# Backup
docker compose exec db pg_dump -U ${DB_USER} ${DB_NAME} > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U ${DB_USER} ${DB_NAME} < backup_YYYYMMDD.sql
```

## Escalabilidade

### Quando escalar a API
- CPU > 70% por mais de 5 minutos
- Response time p95 > 500ms
- Taxa de erros 5xx > 1%

### Como escalar
```bash
# Aumentar réplicas
docker compose up -d --scale api=3
```

## Checklist de incident response

```
[ ] Identificar impacto (quantos usuários afetados)
[ ] Verificar logs (docker compose logs -f api)
[ ] Verificar health checks
[ ] Verificar métricas (Grafana se disponível)
[ ] Notificar stakeholders
[ ] Aplicar fix ou rollback
[ ] Post-mortem em 24h
```
```

### 4. ADR Catalog (`docs/architecture/adrs/README.md`)

```markdown
# Architecture Decision Records

Registro de todas as decisões arquiteturais do {project_name}.

## O que é um ADR?

Um ADR documenta uma decisão arquitetural significativa: o contexto, a decisão
tomada e as consequências. São append-only — nunca editamos, apenas deprecamos.

## Status de um ADR

- **Proposto**: em discussão
- **Aceito**: decisão tomada, em vigor
- **Deprecado**: substituído por outro ADR
- **Superado**: decisão revertida com justificativa

## Índice

| # | Título | Status | Data |
|---|--------|--------|------|
| [001](001-database-choice.md) | Escolha do banco de dados | Aceito | {data} |
| [002](002-api-framework.md) | Framework de API | Aceito | {data} |
| [003](003-auth-strategy.md) | Estratégia de autenticação | Aceito | {data} |
[...]
```

### 5. Docstrings (quando modificar código)

Para funções públicas com lógica não-óbvia, adicionar docstring de UMA linha explicando o PORQUÊ:

```python
# ❌ Não fazer — descreve o quê
async def get_presigned_url(key: str, ttl: int) -> str:
    """Retorna URL pré-assinada para o objeto com TTL especificado."""

# ✅ Fazer — explica o porquê / invariante
async def get_presigned_url(key: str, ttl: int = 3600) -> str:
    """TTL padrão 3600s — URLs permanentes violam o requisito de auditoria."""
```

Docstrings obrigatórias apenas quando:
- Função com comportamento surpreendente ou não-óbvio
- Parâmetros com semântica especial
- Side effects não evidentes pelo nome
- Função deve ser chamada em ordem específica

---

## Regras do Tech Writer

```
❌ Não reescreve documentação que já existe — apenas adiciona
❌ Não documenta código óbvio
❌ Não cria docs sem conteúdo ("TODO: adicionar documentação aqui")
✅ Documenta decisões e trade-offs
✅ Mantém exemplos de código funcionando
✅ Sincroniza docs com código quando há divergência
```

---

## Ao concluir

```
✅ Documentação gerada/atualizada
📋 Produzido:
  - README.md: {nova / atualizada}
  - CONTRIBUTING.md: {nova / atualizada}
  - Runbook: {novo / atualizado}
  - ADR catalog: {N} ADRs indexados
  - Docstrings: {N} adicionadas
```
