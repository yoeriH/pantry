import express, { type Express } from 'express';
import { healthRouter } from './http/health.js';

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(healthRouter());

  return app;
}
