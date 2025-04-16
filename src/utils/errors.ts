class BaseError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message, 400);
    this.name = "BadRequestError";
  }
}

export class DBError extends BaseError {
  constructor(message: string) {
    super(message, 500);
    this.name = "DatabaseError";
  }
}

export class ApiKeyError extends BaseError {
  constructor(message: string = "API key ausente ou inválida") {
    super(message, 401);
    this.name = "ApiKeyError";
  }
}

export class ApiLimitError extends BaseError {
  constructor(message: string = "Limite da API excedido") {
    super(message, 429);
    this.name = "ApiLimitError";
  }
}

export class ContentGenerationError extends BaseError {
  constructor(message: string) {
    super(message, 500);
    this.name = "ContentGenerationError";
  }
}

export class InvalidInputError extends BadRequestError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

export class ModelUnavailableError extends BaseError {
  constructor(
    message: string = "Modelo de IA requisitado não está disponível"
  ) {
    super(message, 503);
    this.name = "ModelUnavailableError";
  }
}
