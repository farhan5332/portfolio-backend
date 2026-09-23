export function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400;

  res.status(status).json({
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
