import { describe, expect, test } from 'vitest';

import { ApiError, toApiError } from './api-error';

describe('toApiError', () => {
  test('takes a single Nest message as-is', () => {
    const error = toApiError(401, {
      message: 'Invalid email or password',
      statusCode: 401,
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.messages).toEqual(['Invalid email or password']);
    expect(error.message).toBe('Invalid email or password');
  });

  test('keeps every ValidationPipe message', () => {
    const error = toApiError(400, {
      message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
      statusCode: 400,
    });

    expect(error.messages).toHaveLength(2);
  });

  // class-validator starts each message with the property name.
  test('maps class-validator messages onto the fields it names', () => {
    const error = toApiError(
      400,
      { message: ['email must be an email', 'price must not be less than 0.01'] },
      ['email', 'price', 'title'],
    );

    expect(error.fieldErrors).toEqual({
      email: 'email must be an email',
      price: 'price must not be less than 0.01',
    });
  });

  // The BFF's own validation writes `field: message`.
  test('maps BFF validation messages onto their fields', () => {
    const error = toApiError(
      400,
      { message: ['password: Use at least 8 characters'] },
      ['password'],
    );

    expect(error.fieldErrors).toEqual({ password: 'Use at least 8 characters' });
  });

  test('does not claim a field from a word that merely starts the same way', () => {
    const error = toApiError(400, { message: ['priceless is not a field'] }, ['price']);

    expect(error.fieldErrors).toEqual({});
  });

  test('falls back to a generic message when the body is not Nest-shaped', () => {
    const error = toApiError(502, '<html>Bad gateway</html>');

    expect(error.messages).toEqual(['Something went wrong (502)']);
  });
});
