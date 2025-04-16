"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("@/config/database"));
const errors_1 = require("@/utils/errors");
const ClientService = {
    async getAll() {
        const clients = await database_1.default.clients.findMany();
        return clients;
    },
    async getActives() {
        const clients = await database_1.default.clients.findMany({
            where: { active: true },
        });
        return clients;
    },
    async getById(id) {
        const client = await database_1.default.clients.findUnique({
            where: { id },
        });
        if (!client) {
            throw new errors_1.NotFoundError("Cliente não encontrado");
        }
        return client;
    },
};
exports.default = ClientService;
