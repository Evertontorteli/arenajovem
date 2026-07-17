# Deploy - Arena Jovem

## Deploy com Docker Compose (recomendado)

## Pré-requisitos

- Docker Desktop (ou Docker Engine + Compose)

## 1) Configurar variáveis

```bash
cp .env.docker.example .env
```

Ajuste senhas e chaves no arquivo `.env`.

## 2) Subir stack completa

```bash
docker compose up -d --build
```

Serviços:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3333/api`
- Swagger: `http://localhost:3333/api/docs`
- MySQL: `localhost:3306`

## 3) Ver logs e status

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

## 4) Parar stack

```bash
docker compose down
```

Para remover também os dados do MySQL:

```bash
docker compose down -v
```

## Observações de produção

- Troque todas as credenciais padrão (`JWT_SECRET`, `CURSOR_SECRET`, senhas MySQL).
- Configure domínio e TLS com um reverse proxy (Nginx/Traefik/Caddy).
- Restrinja `CORS_ORIGIN` para os domínios reais.
- Mantenha `AUTH_BYPASS_PASSWORD=false`.
- Faça backup periódico do volume `mysql_data`.
