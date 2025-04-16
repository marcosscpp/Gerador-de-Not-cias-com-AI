"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("@/config/database"));
const errors_1 = require("@/utils/errors");
const ContentSourceService = {
    async getAll() {
        const configurations = await database_1.default.contentSource.findMany();
        return configurations;
    },
    async getById(id) {
        const configuration = await database_1.default.contentSource.findUnique({
            where: { id },
        });
        if (!configuration) {
            throw new errors_1.NotFoundError("Configuração de fonte de dados não encontrada");
        }
        return configuration;
    },
    async getByClientId(clientId) {
        const clientExists = await database_1.default.clients.findUnique({
            where: { id: clientId },
        });
        if (!clientExists) {
            throw new errors_1.NotFoundError("Cliente não existente");
        }
        const configurations = await database_1.default.contentSource.findMany({
            where: { clientId },
        });
        return configurations;
    },
};
exports.default = ContentSourceService;
