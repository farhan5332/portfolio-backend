import { env } from '../config/env.js';

// Central error handler: every error in the app ends up here and is returned as JSON.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Mongoose schema validation failed
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Invalid MongoDB ObjectId, e.g. /projects/abc
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Unique index violation, e.g. duplicate slug or email
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`;
  }

  // File upload problems (too big, too many files, wrong field name)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File is too large',
      LIMIT_FILE_COUNT: 'Only one file can be uploaded at a time',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field. Send the file in a field named "file".',
    };
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = messages[err.code] || err.message;
  }

  if (statusCode >= 500) console.error('💥', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errorCode && { code: err.errorCode }),
    ...(details && { details }),
    ...(!env.isProd && statusCode >= 500 && { stack: err.stack }),
  });
};
