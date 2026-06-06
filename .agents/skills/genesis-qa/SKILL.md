---
name: genesis-qa
description: >
  Agente QA do Genesis. Define e implementa a estratégia de testes: pirâmide de
  testes, BDD scenarios, testes de integração, E2E. Adapta-se à stack escolhida.
  Garante cobertura mínima, testa isolamento de tenant, valida contratos de API.
  Pensa como usuário, não como desenvolvedor.
metadata:
  author: genesis-framework
  version: "1.0.0"
  role: qa
  framework: genesis
---

## Tarefa

Definir a estratégia de testes e implementar a suíte conforme a stack do projeto. Execute os passos abaixo **na ordem**. Cubra sempre os três níveis da pirâmide — não pule unit tests para fazer só E2E.

## Princípio fundamental: A Pirâmide de Testes

```
         /\
        /  \
       / E2E \           ~10% — Fluxos críticos de usuário
      /--------\
     /          \
    / Integration \      ~30% — API endpoints, DB, services
   /--------------\
  /                \
 /   Unit Tests    \    ~60% — Functions, classes, utils
/____________________\
```

**Nunca inverta a pirâmide.** E2E caro + lento. Unit barato + rápido.

---

## Pré-condições obrigatórias

| Arquivo | Obrigatório | Ação se ausente |
|---------|------------|-----------------|
| `.genesis/manifest.md` | ✅ | PARE — rode `/genesis-intake` primeiro |
| `.genesis/architecture/tech-stack.md` | ✅ | PARE — rode `/genesis-architect` primeiro |
| `.genesis/contracts/openapi.yaml` | ✅ | PARE — não há contrato para testar |
| `.genesis/contracts/test-contracts.md` | recomendado | Gere os cenários Given-When-Then a partir do manifest se ausente |
| `.genesis/architecture/patterns.md` | recomendado | Use convenções padrão se ausente |

## Leia antes de testar

1. `.genesis/manifest.md` → fluxos de usuário
2. `.genesis/contracts/test-contracts.md` → Given-When-Then specs
3. `.genesis/architecture/tech-stack.md` → ferramentas de teste
4. `.genesis/architecture/patterns.md` → convenções

---

## O que você produz

### 1. Test Strategy (`contracts/test-strategy.md`)

```markdown
# Test Strategy — {project_name}

## Pirâmide de Testes

| Nível | Ferramenta | Cobertura alvo | Onde rodar |
|-------|-----------|---------------|-----------|
| Unit | {pytest/jest/go test/junit} | 60% do código | pre-commit |
| Integration | {pytest/supertest/httptest} | 30% dos endpoints | CI/CD |
| E2E | {playwright/cypress/selenium} | 10% fluxos críticos | CI/CD (nightly) |

## Ferramentas

- **Unit/Integration:** {ferramenta}
- **Mocks:** {unittest.mock/jest.mock/testify/mockito}
- **Fixtures/Factories:** {factory-boy/faker.js/go-faker}
- **E2E:** {playwright/cypress}
- **Coverage:** {pytest-cov/istanbul/go cover}

## Cobertura mínima por camada

| Camada | Cobertura mínima |
|--------|-----------------|
| Services (business logic) | 90% |
| Repositories | 70% |
| Controllers/Routers | 80% |
| Utils/Helpers | 95% |
| E2E (fluxos críticos) | 100% dos fluxos listados |

## O que não testar

- Código gerado (migrations, schemas auto-gerados)
- Framework internals (não testar o Django, testar seu código)
- Configurações (testar se a config é lida, não o valor em si)
```

### 2. Test Contracts (`contracts/test-contracts.md`)

Para cada endpoint/feature, gere contratos Given-When-Then:

```markdown
# Test Contracts — {project_name}

## {Módulo: Users}

### TC-001: Criar usuário com sucesso (happy path)
**Dado:** Admin autenticado, email não cadastrado
**Quando:** POST /api/v1/users com {email, password, role: "user"}
**Então:**
- Status 201
- Resposta contém {id, email, role, is_active: true}
- Senha armazenada como hash (nunca plaintext)

### TC-002: Criar usuário com email duplicado
**Dado:** Admin autenticado, email já existente
**Quando:** POST /api/v1/users com email duplicado
**Então:**
- Status 409
- Body: {"error": "EMAIL_IN_USE", "message": "..."}
- Nenhum registro criado no banco

### TC-003: Autorização — role sem permissão não pode criar usuário
**Dado:** Usuário com role "guest" autenticado
**Quando:** POST /api/v1/users
**Então:**
- Status 403
- Body: {"error": "FORBIDDEN"}

### TC-004: Validação de input
**Dado:** Admin autenticado
**Quando:** POST /api/v1/users com email inválido
**Então:**
- Status 422
- Body contém lista de erros com campo "email"

### TC-005: Isolamento de dados (apenas se multi-tenant)
**Dado:** Usuário A e Usuário B em organizações diferentes
**Quando:** Usuário A lista GET /api/v1/resources
**Então:**
- Retorna SOMENTE recursos da organização de A
```

### 3. Test Files (código real)

Adapte à stack. Exemplos:

**Python + pytest:**
```python
# tests/users/test_user_service.py
import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock
from src.users.service import UserService
from src.users.schemas import CreateUserRequest

class TestUserService:
    @pytest.fixture
    def mock_repo(self):
        repo = AsyncMock()
        repo.find_by_email.return_value = None  # email not in use
        return repo

    @pytest.fixture
    def service(self, mock_repo):
        return UserService(repo=mock_repo)

    async def test_create_user_success(self, service, mock_repo):
        # Given
        data = CreateUserRequest(email="user@test.com", password="secret123")

        # When
        user = await service.create_user(data)

        # Then
        mock_repo.save.assert_called_once()
        assert user.email == "user@test.com"

    async def test_create_user_duplicate_email_raises_409(self, service, mock_repo):
        # Given
        mock_repo.find_by_email.return_value = MagicMock()  # email in use

        # When / Then
        with pytest.raises(HTTPException) as exc:
            await service.create_user(CreateUserRequest(email="used@test.com", password="x"))
        assert exc.value.status_code == 409


# tests/users/test_user_api.py — Integration tests
@pytest.mark.asyncio
async def test_create_user_returns_201(client, admin_token):
    response = await client.post(
        "/api/v1/users",
        json={"email": "new@test.com", "password": "pass123"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@test.com"
    assert "password" not in data


@pytest.mark.asyncio
async def test_guest_cannot_create_user(client, guest_token):
    response = await client.post(
        "/api/v1/users",
        json={"email": "x@test.com", "password": "pass123"},
        headers={"Authorization": f"Bearer {guest_token}"}
    )
    assert response.status_code == 403
```

**JavaScript + Jest (NestJS):**
```typescript
// users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService
  let mockRepo: jest.Mocked<UsersRepository>

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: { findByEmail: jest.fn(), save: jest.fn() } },
      ],
    }).compile()
    service = module.get(UsersService)
    mockRepo = module.get(UsersRepository)
  })

  it('should create user with hashed password', async () => {
    mockRepo.findByEmail.mockResolvedValue(null)
    const result = await service.create({ email: 'test@test.com', password: 'secret' })
    expect(result.email).toBe('test@test.com')
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@test.com' })
    )
  })
})
```

### 4. E2E Tests (Playwright)

```typescript
// e2e/users.spec.ts
import { test, expect } from '@playwright/test'
import { loginAs, mockAPI } from '../helpers'

test('admin creates user successfully', async ({ page }) => {
  await loginAs(page, 'admin')
  await page.goto('/users')

  await page.click('[data-testid="invite-user-btn"]')
  await page.fill('[data-testid="email-input"]', 'new@test.com')
  await page.fill('[data-testid="password-input"]', 'secret123')
  await page.click('[data-testid="submit-btn"]')

  await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
  await expect(page.locator('[data-testid="user-row-new@test.com"]')).toBeVisible()
})

test('operator cannot access users page', async ({ page }) => {
  await loginAs(page, 'operator')
  await page.goto('/users')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## Checklist obrigatório por feature

```
Unit tests:
[ ] Happy path
[ ] Cada regra de negócio tem pelo menos 1 teste
[ ] Cada exceção de negócio tem teste
[ ] Funções puras têm 100% cobertura (são baratas de testar)

Integration tests:
[ ] Todos endpoints: 200/201 + corpo correto
[ ] Todos endpoints: error cases (400/401/403/404/409/422)
[ ] Isolamento de tenant (para toda query com dados)
[ ] RBAC: cada role testada em cada endpoint restrito

E2E tests:
[ ] Fluxo principal do usuário funciona de ponta a ponta
[ ] Ação destrutiva tem confirmação
[ ] Toast de sucesso aparece
[ ] Toast de erro aparece em falha de API

Cobertura:
[ ] pytest --cov / jest --coverage mostra >= {mínimo definido}
[ ] Nenhum test quebrado (zero failures)
[ ] CI passa todos os testes antes do merge
```

---

## Testes de segurança básicos (sempre incluir)

```python
# Para toda API autenticada:
async def test_unauthenticated_returns_401():
    response = await client.get("/api/v1/users")
    assert response.status_code == 401

# Para toda API com role:
async def test_wrong_role_returns_403():
    response = await client.get("/api/v1/users",
        headers={"Authorization": f"Bearer {operator_token}"})
    assert response.status_code == 403

# SQL injection básico:
async def test_no_sql_injection_in_search():
    response = await client.get("/api/v1/users?search='; DROP TABLE users; --")
    assert response.status_code in [200, 422]  # handled gracefully
```

---

## CI/CD integration

Adicione ao pipeline:
```yaml
# .github/workflows/test.yml (ou equivalente)
- name: Unit + Integration tests
  run: {pytest -x -q --cov=src --cov-fail-under=80}

- name: E2E tests
  run: {npx playwright test}
  # Apenas em push para main/staging
```

---

## Ao concluir

```
✅ QA Strategy implementada: {feature/módulo}
📋 Entregue:
  - Unit tests: {N} testes
  - Integration tests: {N} testes
  - E2E tests: {N} cenários
  - Cobertura atual: {X}%
  - Falhas: {N} (deve ser 0 antes de commitar)
```
