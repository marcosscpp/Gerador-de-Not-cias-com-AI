"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prismaDatabase = new client_1.PrismaClient();
exports.default = prismaDatabase;
