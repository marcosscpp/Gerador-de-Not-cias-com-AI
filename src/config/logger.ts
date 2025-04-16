import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";


const customFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    const metaString = Object.keys(metadata).length
      ? JSON.stringify(metadata)
      : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
  }
);

const defaultFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  customFormat
);

const loggerInfo = winston.createLogger({
  level: "info",
  format: defaultFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

const loggerError = winston.createLogger({
  level: "error",
  format: defaultFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      ...(error as any),
    };
  }
  return { message: String(error) };
};

export { loggerInfo, loggerError, formatError };
