import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorHandler, notFound } from './middlewares/error.middleware';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Toutes les routes API sont sous /api, ce qui correspond à
  // ApiConstants.baseUrl côté Flutter (http://localhost:3000/api en dev).
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
