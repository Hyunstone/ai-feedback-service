import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', async () => {
      const latency = Date.now() - startTime;
      const actualStatusCode = (res as any).errorStatusCode || res.statusCode;

      try {
        await this.prisma.requestLogs.create({
          data: {
            method: req.method,
            uri: req.originalUrl,
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip,
            isSuccess: actualStatusCode < 400,
            httpStatus: res.statusCode,
            latency,
          },
        });
      } catch (e) {
        console.error('Request log insert failed:', e.message);
      }
    });

    next();
  }
}
