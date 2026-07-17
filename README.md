# Arena Jovem

Aplicação web completa para gestão de gincanas entre equipes de jovens em igrejas, com foco em UX moderna, tema escuro, ranking em tempo real e operações administrativas.

## Stack

- Frontend: React, React Router, Context API, Axios, React Icons, Tailwind CSS
- Backend: Node.js, Express, JWT, Multer, MySQL
- Arquitetura: API REST com separação em camadas (`Controller`, `Service`, `Repository`)

## Estrutura

```txt
ArenaJovem/
├── backend/       # API REST + autenticação + regras da competição
├── frontend/      # Interface web responsiva (participante/admin)
└── docs/          # Documentação funcional e de API
```

## Principais Módulos

- Login com JWT e controle de acesso por perfil (`ADMIN`, `PARTICIPANTE`)
- Dashboard com ranking geral, pontos e atividades
- Equipes (CRUD administrativo + equipes padrão)
- Missões (criação, liberação, envio com foto, aprovação e pontuação automática)
- Feed estilo social (posts com imagem, curtidas e comentários)
- Arrecadação de alimentos com confirmação e crédito automático de pontos
- Pontuação manual com histórico
- Notícias e notificações
- Ranking ao vivo para TV/projetor
- Painel administrativo de estatísticas

## Como rodar

### 1) Banco de dados

1. Crie um banco MySQL.
2. Execute `backend/src/database/schema.sql`.

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API em `http://localhost:3333/api`  
Swagger em `http://localhost:3333/api/docs`

Admin padrão (criado automaticamente no primeiro start, se não existir):

- Email: `admin@arenajovem.com`
- Senha: `admin123`

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Aplicação em `http://localhost:5173`

## Deploy com Docker

Use a stack completa com `frontend + backend + mysql`:

```bash
cp .env.docker.example .env
docker compose up -d --build
```

Endpoints padrão:

- Frontend: `http://localhost:8080`
- API: `http://localhost:3333/api`
- Swagger: `http://localhost:3333/api/docs`

Guia completo em `docs/DEPLOY.md`.

## Acessibilidade e UX

- Contraste alto no tema escuro
- Layout responsivo com navegação clara
- Feedback visual de estados (carregamento/status)
- Componentes reutilizáveis para consistência

## Próximos passos sugeridos

- Refinar recuperação de senha e email transacional
- Adicionar testes automatizados (unitários e integração)
- Melhorar auditoria de ações administrativas
- Implementar WebSocket para atualização de ranking em tempo real sem polling
