import { Worker } from "bullmq";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { Server } from "http";
import { connection } from "./redis";
import routes from "./routes";
import { startAllWorkers } from "./workers";

// Environment variables are loaded by dotenvx in package.json scripts

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET;

// Store server and workers for graceful shutdown
let server: Server;
let workers: Worker[] = [];

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware for API routes
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.substring(7);

  if (token !== API_SECRET) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  next();
};

// Health check (no auth required)
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes (with auth)
app.use("/api", authMiddleware, routes);

// Start workers and server
(async () => {
  try {
    workers = await startAllWorkers();

    server = app.listen(PORT, () => {
      console.log(`Worker server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start workers:", error);
    process.exit(1);
  }
})();

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log("Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} signal received: starting graceful shutdown`);

  // Stop accepting new HTTP requests
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  // Close all workers (finish current jobs, don't accept new ones)
  if (workers.length > 0) {
    try {
      console.log("Closing workers...");
      await Promise.all(
        workers.map(async (worker) => {
          try {
            await worker.close();
            console.log(`Worker ${worker.name} closed`);
          } catch (error) {
            console.error(`Error closing worker ${worker.name}:`, error);
          }
        }),
      );
      console.log("All workers closed");
    } catch (error) {
      console.error("Error closing workers:", error);
    }
  }

  // Close Redis connection
  if (connection) {
    try {
      await connection.quit();
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Error closing Redis connection:", error);
    }
  }

  console.log("Graceful shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
