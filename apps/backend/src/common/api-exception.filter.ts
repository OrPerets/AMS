import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

type ErrorBody = {
  error?: string;
  message?: string | string[];
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof MulterError) {
      const statusCode = HttpStatus.BAD_REQUEST;
      response.status(statusCode).json({
        statusCode,
        error: 'Bad Request',
        message: this.getMulterMessage(exception),
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalized = this.normalizeExceptionResponse(exceptionResponse);

      response.status(statusCode).json({
        statusCode,
        error: normalized.error ?? this.getDefaultErrorLabel(statusCode),
        message: normalized.message ?? exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(statusCode).json({
      statusCode,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private normalizeExceptionResponse(exceptionResponse: string | object): ErrorBody {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    const responseBody = exceptionResponse as ErrorBody;
    return {
      error: responseBody.error,
      message: responseBody.message,
    };
  }

  private getDefaultErrorLabel(statusCode: number) {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      default:
        return 'Error';
    }
  }

  private getMulterMessage(error: MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return 'Uploaded file exceeds the allowed size limit.';
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return 'Too many files were uploaded.';
    }

    return error.message;
  }
}
