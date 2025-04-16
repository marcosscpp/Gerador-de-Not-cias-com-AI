"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = exports.loggerError = exports.loggerInfo = void 0;
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
const customFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, metadata = __rest(_a, ["level", "message", "timestamp"]);
    const metaString = Object.keys(metadata).length
        ? JSON.stringify(metadata)
        : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
});
const defaultFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
}), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
}), customFormat);
const loggerInfo = winston_1.default.createLogger({
    level: "info",
    format: defaultFormat,
    transports: [
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
    ],
});
exports.loggerInfo = loggerInfo;
const loggerError = winston_1.default.createLogger({
    level: "error",
    format: defaultFormat,
    transports: [
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
    ],
});
exports.loggerError = loggerError;
const formatError = (error) => {
    if (error instanceof Error) {
        return Object.assign({ message: error.message, stack: error.stack }, error);
    }
    return { message: String(error) };
};
exports.formatError = formatError;
