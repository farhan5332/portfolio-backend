import { ApiError } from '../utils/ApiError.js';

// Validates req.body against a Zod schema and replaces it with the cleaned data.
// Unknown fields are stripped, so clients can't sneak in extra fields like "role".
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return next(new ApiError(400, 'Validation failed', { details }));
  }

  req.body = result.data;
  next();
};
