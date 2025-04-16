"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("@/config/database"));
const errors_1 = require("@/utils/errors");
const AiConfigurationService = {
    async getAll() {
        const aiConfigurations = await database_1.default.aiConfiguration.findMany();
        return aiConfigurations;
    },
    async getById(id) {
        const aiConfiguration = await database_1.default.aiConfiguration.findUnique({
            where: { id },
        });
        if (!aiConfiguration) {
            throw new errors_1.NotFoundError("Configuração de IA não encontrada");
        }
        return aiConfiguration;
    },
    async getByClientId(clientId) {
        const clientExists = await database_1.default.clients.findUnique({
            where: { id: clientId },
        });
        if (!clientExists) {
            throw new errors_1.NotFoundError("Cliente não existente");
        }
        const aiConfigurations = await database_1.default.aiConfiguration.findFirst({
            where: { clientId },
        });
        if (!aiConfigurations) {
            throw new errors_1.NotFoundError("Configuração de IA não encontrada");
        }
        return aiConfigurations;
    },
};
exports.default = AiConfigurationService;
