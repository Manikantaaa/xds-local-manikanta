import { createLogger, format, transports } from "winston";
import { LoggingWinston } from "@google-cloud/logging-winston";

const developmentFormat = format.combine(
  format.timestamp(),
  format.cli(),
  format.json(),
  format.errors({ stack: true }),
  format.splat(),
  format.simple(),
);
const developmentLogger = {
  level: process.env.XDS_LOG_LEVEL || "debug",
  format: developmentFormat,
  transports: [new transports.Console()],
};

const prodFormat = developmentFormat;
const prodLogger = {
  level: process.env.XDS_LOG_LEVEL || "info",
  format: prodFormat,
  transports: [new transports.Console(), new LoggingWinston()],
};

// export log instance based on the current environment
let instanceLogger;
switch (process.env.NODE_ENV) {
  case "development":
    instanceLogger = developmentLogger;
    break;
  default:
    instanceLogger = prodLogger;
}

export const instance = createLogger(instanceLogger);
