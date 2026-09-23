// Throw this anywhere in a route/controller to send a clean JSON error response.
// Examples:
//   throw new ApiError(404, 'Project not found');
//   throw new ApiError(401, 'Access token expired', { code: 'TOKEN_EXPIRED' });
export class ApiError extends Error {
  constructor(statusCode, message, { details, code } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = code; // machine-readable code the admin panel can check
  }
}
