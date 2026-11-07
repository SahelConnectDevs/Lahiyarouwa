import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { env } from './config/env';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { apiRateLimit } from './middlewares/rateLimit.middleware';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  // Derrière nginx sur le VPS : fait confiance à X-Forwarded-For pour que
  // req.ip (et donc le rate limiting par IP) voie le vrai client.
  if (env.trustProxy > 0) app.set('trust proxy', env.trustProxy);

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  // Aucune route n'attend de gros corps (pas d'upload) : 100 ko suffisent.
  app.use(express.json({ limit: '100kb' }));

  // Sonde utilisée par nginx / la supervision : 503 si MongoDB est injoignable.
  app.get('/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
  });

  // Toutes les routes API sont sous /api, ce qui correspond à
  // ApiConstants.baseUrl côté Flutter (http://localhost:3000/api en dev).
  app.use('/api', apiRateLimit, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
