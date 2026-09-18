import app from './backend/app.js';
import { PORT, IS_VERCEL } from './backend/config/env.js';

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Omnify Server] active on http://localhost:${PORT}`);
  });
}

export default app;
