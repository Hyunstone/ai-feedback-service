import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let status = 500;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    this.logger.error(
      `[${request.method}] ${request.path}`,
      exception instanceof Error ? exception.stack : '',
    );

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      const message =
        typeof responseBody === 'string'
          ? responseBody
          : Array.isArray((responseBody as any)?.message)
            ? (responseBody as any).message.join(', ')
            : ((responseBody as any)?.message ?? 'Unexpected error');

      response.status(200).json({
        result: 'failed',
        message,
      });
    } else {
      this.logger.error('Unhandled exception', exception as Error);

      response.status(200).json({
        result: 'failed',
        message:
          exception instanceof Error && exception.message
            ? exception.message
            : 'Internal Server Error',
      });
    }
    (response as any).errorStatusCode = status;
  }
}
