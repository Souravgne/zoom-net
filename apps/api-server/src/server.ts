// apps/api-server/src/server.ts
import app from './app';
import config, { validateConfig } from './config';
import logger from './logger';

// Validate the configuration before starting the server
try {
    validateConfig();
} catch (error) {
    const err = error as Error;
    logger.error({ err, service: 'api-server' }, 'Config validation failed');
    process.exit(1);
}

app.listen(config.port, () => {
  logger.info({ service: 'api-server', port: config.port }, `API Server listening on port ${config.port}`);
});
