import { GlobalExceptionsFilter } from 'src/common/exception/exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('GlobalExceptionsFilter', () => {
  let filter: GlobalExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      path: '/test',
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('HttpException을 처리할 수 있다', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      result: 'failed',
      message: 'Forbidden',
    });
  });

  it('HttpException이 array message를 반환할 때 처리할 수 있다', () => {
    const exception = new HttpException(
      { message: ['error1', 'error2'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      result: 'failed',
      message: 'error1, error2',
    });
  });

  it('HttpException이 object message를 반환할 때 처리할 수 있다', () => {
    const exception = new HttpException(
      { message: 'Custom error message' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      result: 'failed',
      message: 'Custom error message',
    });
  });

  it('Unhandled Exception(기타 에러)을 처리할 수 있다', () => {
    const exception = new Error('Unhandled exception occurred');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      result: 'failed',
      message: 'Unhandled exception occurred',
    });
  });

  it('에러 객체가 없을 경우 기본 메시지로 처리한다', () => {
    const exception = { unknown: 'error' } as any;

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      result: 'failed',
      message: 'Internal Server Error',
    });
  });
});
