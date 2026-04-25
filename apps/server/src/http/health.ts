import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';

export function healthRouter(): Router {
  const router = createRouter();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return router;
}
