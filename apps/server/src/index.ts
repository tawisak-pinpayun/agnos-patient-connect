import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@apc/shared';
import { config } from './config';
import { closeMongo, connectMongo, pingMongo } from './db/mongo';
import { sessionsRouter } from './routes/sessions';
import { startIdleSweeper } from './services/idleSweeper';
import { registerSocketHandlers } from './socket/handlers';

async function bootstrap(): Promise<void> {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '256kb' }));

  app.get('/healthz', async (_req, res) => {
    const dbOk = await pingMongo();
    res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded', db: dbOk });
  });

  app.use('/api', sessionsRouter);

  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
    transports: ['websocket', 'polling'],
    pingInterval: 20_000,
    pingTimeout: 20_000,
  });

  registerSocketHandlers(io);
  const stopSweeper = startIdleSweeper(io);

  httpServer.listen(config.port, () => {
    console.log(`[server] listening on port ${config.port}`);
    console.log(`[server] allowed origins: ${config.corsOrigins.join(', ')}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] received ${signal}, shutting down`);
    stopSweeper();
    await io.close();
    httpServer.close();
    await closeMongo();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
