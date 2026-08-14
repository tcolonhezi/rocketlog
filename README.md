# RocketLog

Uma API simples para gerenciar entregas de encomendas. Você cria usuários, registra entregas e acompanha o status delas através de logs estruturados de auditoria.

## O que faz

- **Usuários**: Cria contas com 3 tipos de role (ADMIN, DRIVER, CUSTOMER)
- **Entregas**: Registra entregas com descrição e endereço, começando como PENDING
- **Status**: Muda status das entregas seguindo uma máquina de estados (PENDING → IN_TRANSIT → DELIVERED ou CANCELED)
- **Logs estruturados**: Cada mudança de status gera um log de auditoria com status anterior, novo status e quem fez a mudança
- **Autenticação**: JWT para proteger as rotas

## Stack

- **Runtime**: Node.js + Express.js
- **Linguagem**: TypeScript
- **Banco**: PostgreSQL com Prisma ORM
- **Segurança**: JWT + bcrypt
- **Testes**: Jest + Supertest

## Como rodar

### Pré-requisitos

- Node.js 20+
- PostgreSQL rodando (via Docker ou local)

### Instalação

```bash
# Instala dependências
npm install

# Copia o .env e configura as variáveis
cp .env.example .env

# Roda as migrations do banco
npx prisma migrate dev

# Inicia em modo desenvolvimento
npm run dev
```

### Rodar testes

```bash
npm test
```

### Build e produção

```bash
npm run build
npm start
```

## Autorização por Role

Cada usuário tem um role que define o que pode fazer:

| Ação | ADMIN | DRIVER | CUSTOMER |
|------|-------|--------|----------|
| Criar usuário | ✓ | ✓ | ✓ |
| Login | ✓ | ✓ | ✓ |
| Ver seu próprio perfil | ✓ | ✓ | ✓ |
| Criar entrega | ✓ | ✗ | ✗ |
| Listar entregas | ✓ | ✓ | ✗ |
| Ver detalhes de uma entrega | ✓ | ✓ | ✓ (via link direto) |
| Registrar mudança de status | ✓ | ✓ | ✗ |

**Resumindo:**
- **ADMIN**: Acesso total a tudo, incluindo criar entregas.
- **DRIVER**: Pode listar todas as entregas (não há vínculo formal entre driver e entrega no schema) e registrar mudanças de status.
- **CUSTOMER**: Não cria nem lista entregas — apenas acompanha o status de uma entrega específica através do link/ID recebido por fora do sistema (ex: WhatsApp, email).

> ⚠️ Como não existe vínculo formal entre `DRIVER` e `Delivery` no schema, todo `DRIVER` vê e pode alterar **todas** as entregas do sistema, não só as que estão sob sua responsabilidade. Ver [Known Issues](#known-issues).

## Máquina de estados das entregas

A mudança de status não é livre — segue transições válidas, aplicadas via `delivery-transitions.ts`:

```
PENDING     → IN_TRANSIT, CANCELED
IN_TRANSIT  → DELIVERED, CANCELED
DELIVERED   → (estado final, sem saída)
CANCELED    → (estado final, sem saída)
```

Tentar uma transição fora dessa tabela (pular etapa, "voltar" um status, ou alterar uma entrega já finalizada) retorna erro.

## Como usar

### 1. Criar um usuário

```bash
POST /users
Content-Type: application/json

{
  "name": "João",
  "email": "joao@email.com",
  "password": "123456"
}
```

**Resposta (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "João",
  "email": "joao@email.com",
  "role": "CUSTOMER",
  "createdAt": "2026-08-13T10:30:00Z",
  "updatedAt": "2026-08-13T10:30:00Z"
}
```

### 2. Fazer login

```bash
POST /sessions
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "123456"
}
```

**Resposta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use este token em todas as requisições autenticadas: `Authorization: Bearer <token>`

### 3. Ver perfil

```bash
GET /users
Authorization: Bearer <seu-token>
```

**Resposta (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "João",
  "email": "joao@email.com",
  "role": "CUSTOMER",
  "createdAt": "2026-08-13T10:30:00Z",
  "updatedAt": "2026-08-13T10:30:00Z"
}
```

### 4. Criar uma entrega

**Permissão:** ADMIN

```bash
POST /deliveries
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Encomenda de livros",
  "address": "Rua X, 123"
}
```

**Resposta (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Encomenda de livros",
  "address": "Rua X, 123",
  "status": "PENDING",
  "createdAt": "2026-08-13T10:31:00Z",
  "updatedAt": "2026-08-13T10:31:00Z"
}
```

### 5. Listar entregas

**Permissão:** ADMIN ou DRIVER (retorna todas as entregas do sistema — não há filtro por motorista, ver Known Issues)

```bash
GET /deliveries
Authorization: Bearer <seu-token>
```

**Resposta (200):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Encomenda de livros",
    "address": "Rua X, 123",
    "status": "PENDING",
    "createdAt": "2026-08-13T10:31:00Z",
    "updatedAt": "2026-08-13T10:31:00Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "João",
      "email": "joao@email.com"
    }
  }
]
```

### 6. Ver detalhes da entrega com logs

**Permissão:** ADMIN, DRIVER ou CUSTOMER (o CUSTOMER só acessa se tiver o ID/link da própria entrega — não há listagem para ele)

```bash
GET /deliveries/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <seu-token>
```

**Resposta (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Encomenda de livros",
  "address": "Rua X, 123",
  "status": "IN_TRANSIT",
  "createdAt": "2026-08-13T10:31:00Z",
  "updatedAt": "2026-08-13T10:32:30Z",
  "deliveryLogs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "deliveryId": "660e8400-e29b-41d4-a716-446655440001",
      "description": "Saiu para entrega",
      "previousStatus": "PENDING",
      "newStatus": "IN_TRANSIT",
      "changedById": "990e8400-e29b-41d4-a716-446655440099",
      "createdAt": "2026-08-13T10:32:30Z",
      "updatedAt": "2026-08-13T10:32:30Z"
    }
  ]
}
```

### 7. Registrar mudança de status (cria log + atualiza entrega)

**Permissão:** ADMIN ou DRIVER

A rota antiga de `PATCH /deliveries/:id` (alterar status direto, sem log) foi removida. Toda mudança de status passa obrigatoriamente por aqui, dentro de uma transação — assim o status da entrega e o log de auditoria nunca ficam dessincronizados.

```bash
POST /delivery-logs
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "delivery_id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "IN_TRANSIT",
  "description": "Saiu para entrega"
}
```

**Resposta (200):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "deliveryId": "660e8400-e29b-41d4-a716-446655440001",
  "description": "Saiu para entrega",
  "previousStatus": "PENDING",
  "newStatus": "IN_TRANSIT",
  "changedById": "990e8400-e29b-41d4-a716-446655440099",
  "createdAt": "2026-08-13T10:32:30Z",
  "updatedAt": "2026-08-13T10:32:30Z"
}
```

**Regras aplicadas antes de gravar:**
- A entrega precisa existir.
- A entrega não pode estar `CANCELED` ou `DELIVERED` (estados finais).
- A transição pedida (`status atual → status novo`) precisa estar na tabela de transições válidas.
- `changedById` é preenchido automaticamente com o usuário autenticado (via JWT), não vem do corpo da requisição.

## Estrutura do banco

```
User
├── id (UUID)
├── name
├── email
├── password (bcrypted)
├── role (ADMIN, DRIVER, CUSTOMER)
├── deliveries (relacionamento)
└── deliveryLogs (relacionamento, como changedBy)

Delivery
├── id (UUID)
├── userId (FK)
├── description
├── address
├── status (PENDING, IN_TRANSIT, DELIVERED, CANCELED)
└── deliveryLogs (relacionamento)

DeliveryLog
├── id (UUID)
├── deliveryId (FK)
├── description
├── previousStatus (DeliveryStatus, opcional — log inicial não tem status anterior)
├── newStatus (DeliveryStatus)
├── changedById (FK para User, opcional — logs antigos não têm autor registrado)
└── delivery (relacionamento)
```

## Variáveis de ambiente

```
DATABASE_URL=postgresql://user:password@localhost:5432/rocketlog
JWT_SECRET=sua-chave-secreta-aqui
NODE_ENV=development
PORT=3000
```

## Principais middlewares

- **ensureAuthenticated**: Valida o JWT e protege rotas
- **verifyUserAuthorization**: Controla acesso por role do usuário
- **error-handling**: Captura erros e retorna respostas padronizadas

## Testes

- Criação de usuários
- Login (geração de token)
- Listar e criar entregas
- **Validação de transições de status** (`valid-delivery-transitions.test.ts`) — testes unitários puros, sem dependência de banco, cobrindo transições válidas, transições fora de ordem e tentativas de alterar entregas em estado final.

Roda com Jest + Supertest.

## Estrutura de pastas

```
src/
├── app.ts              # Configuração do Express
├── server.ts           # Inicialização do servidor
├── controllers/        # Lógica das requisições
├── routes/              # Definição das rotas
├── middlewares/         # Middlewares de autenticação e erro
├── database/            # Configuração Prisma
├── configs/              # Configurações (ex: JWT)
├── types/                # Tipos do Express
└── util/
    ├── AppError.ts
    └── delivery-transitions.ts  # Máquina de estados das entregas
```

## Known Issues

Pontos identificados durante o desenvolvimento, ainda não corrigidos:

- [ ] Não existe vínculo entre `DRIVER` e `Delivery` no schema — qualquer motorista vê e pode alterar o status de qualquer entrega do sistema, não só as suas. Modelar isso exigiria um campo tipo `driverId` (ou tabela de atribuição) em `Delivery`.
- [ ] `POST /deliveries` pega `user_id` direto do corpo da requisição. Como só `ADMIN` cria entregas hoje, isso é esperado (o admin escolhe o dono), mas vale validar que o `user_id` informado existe e tem role `CUSTOMER` antes de gravar.

---

É isso. Uma API REST simples, bem estruturada e fácil de entender.