import express from 'express';
import ytdl from 'ytdl-core';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Enable CORS only for the '/update-url' endpoint
app.post('/update-url', cors(), (req: Request, res: Response) => {
  const { url, sessionId } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = { url: '', status: 'stop', volume: 100, action: null, value: null, lastSkipValue: null, lastSkipDirection: null };
  }

  sessions[sessionId].url = url;
  res.json({ status: 'URL updated', sessionId });
});

let sessions: { [key: string]: any } = {};

// Original functionality for controlling sessions
app.post('/control', (req: Request, res: Response) => {
  const { action, value, sessionId } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = { url: '', status: 'stop', volume: 100, action: null, value: null, lastSkipValue: null, lastSkipDirection: null };
  }

  const session = sessions[sessionId];

  if (action === 'skip') {
    const direction = value > session.lastSkipValue ? 'forward' : 'backward';

    if (value !== session.lastSkipValue || direction !== session.lastSkipDirection) {
      session.lastSkipValue = value;
      session.lastSkipDirection = direction;
      session.action = action;
      session.value = value;
      res.json({ status: 'Skip action processed', action, value, sessionId });
    } else {
      res.json({ status: 'Skip action ignored', action, value, sessionId });
    }
  } else {
    session.action = action;
    session.value = value;
    res.json({ status: 'Command received', action, value, sessionId });
  }
});

app.get('/current-url/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  res.json({
    success: true,
    sessionId,
    url: sessions[sessionId].url,
    status: sessions[sessionId].status,
    volume: sessions[sessionId].volume,
    action: sessions[sessionId].action,
    value: sessions[sessionId].value
  });
});

// New functionality for YouTube handling...
// Remaining routes...

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

