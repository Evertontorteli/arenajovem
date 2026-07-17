# API - Arena Jovem

Base URL: `http://localhost:3333/api`

## Autenticação

- `POST /auth/login`
- `POST /auth/register` (admin)

## Usuários

- `GET /users/me`
- `PUT /users/me`
- `GET /users` (admin)
- `PATCH /users/:id/team` (admin)

## Equipes

- `GET /teams`
- `POST /teams` (admin)
- `PUT /teams/:id` (admin)
- `DELETE /teams/:id` (admin)

## Competição

- `GET /competition/missions`
- `POST /competition/missions` (admin, upload imagem de capa)
- `PUT /competition/missions/:id` (admin)
- `DELETE /competition/missions/:id` (admin)
- `PATCH /competition/missions/:id/status` (admin)
- `POST /competition/missions/:id/submit` (upload imagem)
- `GET /competition/mission-submissions` (admin)
- `PATCH /competition/mission-submissions/:id/review` (admin)

- `GET /competition/foods`
- `POST /competition/foods`
- `PATCH /competition/foods/:id/confirm` (admin)

- `POST /competition/scores/manual` (admin)
- `GET /competition/scores/history`

- `GET /competition/ranking`

## Social

- `GET /social/posts?limit=6&cursor=<token>` (cursor assinado e com expiração)
- `POST /social/posts` (upload imagem)
- `POST /social/posts/:id/like`
- `DELETE /social/posts/:id/like`
- `GET /social/posts/:id/comments`
- `POST /social/posts/:id/comments`
- `DELETE /social/comments/:id`

- `GET /social/news`
- `POST /social/news` (admin)
- `PUT /social/news/:id` (admin)
- `DELETE /social/news/:id` (admin)

- `GET /social/notifications`
- `PATCH /social/notifications/:id/read`

## Dashboard

- `GET /dashboard/user`
- `GET /dashboard/admin` (admin)
