# Taskyoshi

Aplicação full-stack (React + Node/Express + Prisma/PostgreSQL) para gerenciar colunas e tarefas em estilo Kanban, com autenticação via JWT (cookie) e controle de acesso por papéis (ADMIN/DEV).

## Principais recursos
- Autenticação com JWT (cookie httpOnly) e middleware de proteção.
- Controle de acesso por Role (ADMIN/DEV).
- Colunas e tarefas com ordenação e unicidade:
  - Column: @@unique([userId, order])
  - Task: @@unique([columnId, order])
- Frontend React com tema (light/dark) e toasts.
- API REST com CRUD de colunas e tarefas.

## Stack
- Frontend: React, React Router, axios, react-toastify.
- Backend: Node.js, Express, Prisma ORM.
- Banco: PostgreSQL.

## Estrutura
- backend/ → API, Prisma e middlewares
- frontend/ → app React (Vite)

## Pré-requisitos
- Node.js 18+
- PostgreSQL
- VS Code (opcional) + Thunder Client (para testar API)

## Configuração

### 1) Backend
1. Instalar dependências
   ```bat
   cd backend
   npm install
   ```
2. Criar .env com sua conexão Postgres e segredo JWT
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public"
   JWT_SECRET="um-segredo-forte-aqui"
   ```
3. Rodar migrações e gerar o client
   ```bat
   npx prisma migrate dev --name init
   npx prisma generate
   ```
4. Iniciar servidor
   ```bat
   npm run dev
   ```
   API padrão: http://localhost:5001

5. (Opcional) Abrir o Prisma Studio
   ```bat
   npx prisma studio
   ```

### 2) Frontend
1. Instalar dependências
   ```bat
   cd ../frontend
   npm install
   ```
2. Iniciar
   ```bat
   npm run dev
   ```
   App padrão (Vite): http://localhost:5173

Observação: O frontend usa axios com withCredentials para enviar o cookie de autenticação e aponta para a API http://localhost:5001.
