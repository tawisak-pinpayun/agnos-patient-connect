import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import * as service from '../services/sessionService';

export const sessionsRouter = Router();

sessionsRouter.get('/sessions', async (_req, res) => {
  try {
    const summaries = await service.listSummaries();
    res.json({ sessions: summaries });
  } catch (error) {
    console.error('[api] GET /sessions failed', error);
    res.status(500).json({ message: 'FAILED_TO_LIST_SESSIONS' });
  }
});

sessionsRouter.post('/sessions', async (_req, res) => {
  try {
    const sessionId = randomUUID().replace(/-/g, '').slice(0, 20);
    const snapshot = await service.joinSession(sessionId);
    res.status(201).json({ session: snapshot });
  } catch (error) {
    console.error('[api] POST /sessions failed', error);
    res.status(500).json({ message: 'FAILED_TO_CREATE_SESSION' });
  }
});

sessionsRouter.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  if (!service.isValidSessionId(sessionId)) {
    res.status(400).json({ message: 'INVALID_SESSION_ID' });
    return;
  }

  try {
    const snapshot = await service.getSnapshot(sessionId);
    if (!snapshot) {
      res.status(404).json({ message: 'SESSION_NOT_FOUND' });
      return;
    }
    res.json({ session: snapshot });
  } catch (error) {
    console.error('[api] GET /sessions/:sessionId failed', error);
    res.status(500).json({ message: 'FAILED_TO_GET_SESSION' });
  }
});
