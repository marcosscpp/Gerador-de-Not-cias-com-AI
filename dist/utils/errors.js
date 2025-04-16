"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUnavailableError = exports.InvalidInputError = exports.ContentGenerationError = exports.ApiLimitError = exports.ApiKeyError = exports.DBError = exports.BadRequestError = exports.NotFoundError = void 0;
class BaseError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}
class NotFoundError extends BaseError {
    constructor(message) {
        super(message, 404);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends BaseError {
    constructor(message) {
        super(message, 400);
        this.name = "BadRequestError";
    }
}
exports.BadRequestError = BadRequestError;
class DBError extends BaseError {
    constructor(message) {
        super(message, 500);
        this.name = "DatabaseError";
    }
}
exports.DBError = DBError;
class ApiKeyError extends BaseError {
    constructor(message = "API key ausente ou inválida") {
        super(message, 401);
        this.name = "ApiKeyError";
    }
}
exports.ApiKeyError = ApiKeyError;
class ApiLimitError extends BaseError {
    constructor(message = "Limite da API excedido") {
        super(message, 429);
        this.name = "ApiLimitError";
    }
}
exports.ApiLimitError = ApiLimitError;
class ContentGenerationError extends BaseError {
    constructor(message) {
        super(message, 500);
        this.name = "ContentGenerationError";
    }
}
exports.ContentGenerationError = ContentGenerationError;
class InvalidInputError extends BadRequestError {
    constructor(message) {
        super(message);
        this.name = "InvalidInputError";
    }
}
exports.InvalidInputError = InvalidInputError;
class ModelUnavailableError extends BaseError {
    constructor(message = "Modelo de IA requisitado não está disponível") {
        super(message, 503);
        this.name = "ModelUnavailableError";
    }
}
exports.ModelUnavailableError = ModelUnavailableError;
