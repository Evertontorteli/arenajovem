const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const setupSwagger = require('./config/swagger');

dotenv.config({
  path: path.join(__dirname, '../.env'),
  override: true,
});

const app = express();

const corsOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const isDevelopment = process.env.NODE_ENV !== 'production';

function isLocalhostOrigin(origin) {
  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

function isSameOrigin(origin, requestHost) {
  if (!origin || !requestHost) return false;
  try {
    return new URL(origin).host === requestHost;
  } catch (_error) {
    return false;
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use((req, res, next) => {
  cors({
    origin: (origin, callback) => {
      // Sem Origin (curl, health checks) ou lista vazia: libera
      if (!origin || corsOrigins.length === 0) {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Frontend e API no mesmo dominio (Vercel Services)
      if (isSameOrigin(origin, req.get('host'))) {
        return callback(null, true);
      }
      if (isDevelopment && isLocalhostOrigin(origin)) {
        return callback(null, true);
      }
      // Nao lanca erro (evita 500); so nega o header CORS
      return callback(null, false);
    },
  })(req, res, next);
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, 'uploads'), {
    dotfiles: 'deny',
    maxAge: '1d',
  })
);

setupSwagger(app);
app.use('/api', routes);
app.use(errorMiddleware);

module.exports = app;
