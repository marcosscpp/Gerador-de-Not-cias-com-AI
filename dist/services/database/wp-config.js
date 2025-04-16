"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("@/config/database"));
const errors_1 = require("@/utils/errors");
const WordpressConfigurationService = {
    async getAll() {
        const configurations = await database_1.default.wordpressConfiguration.findMany();
        return configurations;
    },
    async getById(id) {
        const configuration = await database_1.default.wordpressConfiguration.findUnique({
            where: { id },
        });
        if (!configuration) {
            throw new errors_1.NotFoundError("Configuração do WordPress não encontrada");
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
        const configurations = await database_1.default.wordpressConfiguration.findFirst({
            where: { clientId },
        });
        return configurations;
    },
};
exports.default = WordpressConfigurationService;
