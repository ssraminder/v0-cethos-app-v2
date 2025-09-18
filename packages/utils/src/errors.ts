export class CethosError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = "CethosError"
  }
}

export class ValidationError extends CethosError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, details)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends CethosError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends CethosError {
  constructor(message = "Insufficient permissions") {
    super(message, "AUTHORIZATION_ERROR", 403)
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends CethosError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND_ERROR", 404)
    this.name = "NotFoundError"
  }
}
