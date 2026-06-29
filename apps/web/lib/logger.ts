/**
 * Structured logging via pino.
 * 
 * Usage in API routes:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ orderId, userId }, "Order created");
 * 
 * PII redaction: phone, email, password, token fields are automatically redacted.
 * In production, outputs JSON for log aggregation.
 * In development, outputs pretty-printed for readability.
 */
import pino from "pino";

const redactPaths = [
  "phone",
  "email",
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "otp",
  "access_token",
  "refresh_token",
  "id_token",
  "authorization",
  "req.headers.authorization",
  "req.headers.cookie",
];

export const logger = pino({
  name: "msm-web",
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      userAgent: req.headers?.["user-agent"],
    }),
  },
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

/**
 * Create a child logger with request context.
 */
export function createRequestLogger(context: {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
}) {
  return logger.child(context);
}
