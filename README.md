# RocketLog

Uma API simples para gerenciar entregas de encomendas. Você cria usuários, registra entregas e acompanha o status delas através de logs.

## O que faz

- **Usuários**: Cria contas com 3 tipos de role (ADMIN, DRIVER, CUSTOMER)
- **Entregas**: Registra entregas com descrição e endereço, começando como PENDING
- **Status**: Muda status das entregas (PENDING → IN_TRANSIT → DELIVERED ou CANCELED)
- **Logs**: Cada mudança de status gera um log automático para auditoria
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
| Criar entrega | ✓ | ✗ | ✓ |
| Listar entregas | ✓ | ✓ (suas) | ✓ (suas) |
| Ver detalhes da entrega | ✓ | ✓ (suas) | ✓ (suas) |
| Atualizar status | ✓ | ✓ | ✗ |
| Adicionar log | ✓ | ✓ | ✗ |

**Resumindo:**
- **ADMIN**: Acesso total a tudo
- **DRIVER**: Pode ver suas entregas e atualizar status/logs
- **CUSTOMER**: Pode criar e ver suas próprias entregas, mas não pode alterar status

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

**Permissão:** ADMIN ou CUSTOMER

```bash
POST /deliveries
Authorization: Bearer <seu-token>
Content-Type: application/json

{
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

**Permissão:** Qualquer usuário autenticado (vê apenas as suas)

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

**Permissão:** ADMIN ou dono da entrega

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
  "logs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "deliveryId": "660e8400-e29b-41d4-a716-446655440001",
      "description": "Saiu para entrega",
      "createdAt": "2026-08-13T10:32:30Z",
      "updatedAt": "2026-08-13T10:32:30Z"
    }
  ]
}
```

### 7. Atualizar status da entrega

**Permissão:** ADMIN ou DRIVER

```bash
PATCH /deliveries/660e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "status": "IN_TRANSIT"
}
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
  "updatedAt": "2026-08-13T10:32:30Z"
}
```

### 8. Adicionar log de status

**Permissão:** ADMIN ou DRIVER

```bash
POST /delivery-log
Authorization: Bearer <seu-token>
Content-Type: application/json

{
  "deliveryId": "660e8400-e29b-41d4-a716-446655440001",
  "description": "Saiu para entrega"
}
```

**Resposta (201):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "deliveryId": "660e8400-e29b-41d4-a716-446655440001",
  "description": "Saiu para entrega",
  "createdAt": "2026-08-13T10:32:30Z",
  "updatedAt": "2026-08-13T10:32:30Z"
}
```

## Estrutura do banco

```
User
├── id (UUID)
├── name
├── email
├── password (bcrypted)
├── role (ADMIN, DRIVER, CUSTOMER)
└── Deliveries (relacionamento)

Delivery
├── id (UUID)
├── userId (FK)
├── description
├── address
├── status (PENDING, IN_TRANSIT, DELIVERED, CANCELED)
└── DeliveryLogs (relacionamento)

DeliveryLog
├── id (UUID)
├── deliveryId (FK)
└── description (registra a mudança de status)
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

Tem testes básicos para:
- Criação de usuários
- Login (geração de token)
- Listar e criar entregas

Roda com Jest + Supertest.

## Estrutura de pastas

```
src/
├── app.ts              # Configuração do Express
├── server.ts           # Inicialização do servidor
├── controllers/        # Lógica das requisições
├── routes/             # Definição das rotas
├── middlewares/        # Middlewares de autenticação e erro
├── database/           # Configuração Prisma
├── configs/            # Configurações (ex: JWT)
├── types/              # Tipos do Express
└── util/               # Utilitários (AppError)
```

É isso. Uma API REST simples, bem estruturada e fácil de entender.
