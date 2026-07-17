const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const setupSwagger = require('./config/swagger');

dotenv.config();

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

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin:
      corsOrigins.length === 0
        ? '*'
        : (origin, callback) => {
            if (!origin || corsOrigins.includes(origin)) {
              return callback(null, true);
            }
            if (isDevelopment && isLocalhostOrigin(origin)) {
              return callback(null, true);
            }
            return callback(new Error('Origem não permitida pelo CORS.'));
          },
  })
);
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
