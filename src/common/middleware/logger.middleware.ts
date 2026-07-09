import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'requests.txt');

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const line = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\n`;
      this.writeLog(line);
    });

    next();
  }

  private async writeLog(line: string) {
    try {
      await mkdir(LOG_DIR, { recursive: true });
      await appendFile(LOG_FILE, line);
    } catch (err) {
      console.error('Failed to write request log:', err);
    }
  }
}
