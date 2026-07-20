function errorMiddleware(error, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error('[API ERROR]', error?.message || error, error?.stack);

  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? 'Erro interno do servidor.' : error.message;

  return res.status(statusCode).json({
    message,
    details:
      process.env.NODE_ENV === 'development' && statusCode === 500
        ? error.stack
        : undefined,
  });
}

module.exports = errorMiddleware;
