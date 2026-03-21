/**
 * Unit tests for src/middleware/error.middleware.js
 */
const errorHandler = require('../src/middleware/error.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler middleware', () => {
  it('returns 500 and error message by default', () => {
    const res = mockRes();
    const err = new Error('Something went wrong');
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Something went wrong',
    }));
  });

  it('uses err.statusCode when provided', () => {
    const res = mockRes();
    const err = Object.assign(new Error('Not Found'), { statusCode: 404 });
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('handles Mongoose duplicate key error (code 11000)', () => {
    const res = mockRes();
    const err = Object.assign(new Error('duplicate'), {
      code: 11000,
      keyValue: { email: 'test@test.com' },
    });
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Email already exists',
    }));
  });

  it('handles Mongoose ValidationError', () => {
    const res = mockRes();
    const err = Object.assign(new Error('validation'), {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        name: { message: 'Name is required' },
      },
    });
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    const msg = res.json.mock.calls[0][0].message;
    expect(msg).toContain('Email is required');
    expect(msg).toContain('Name is required');
  });

  it('handles JsonWebTokenError', () => {
    const res = mockRes();
    const err = Object.assign(new Error('jwt malformed'), { name: 'JsonWebTokenError' });
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid token' }));
  });

  it('handles TokenExpiredError', () => {
    const res = mockRes();
    const err = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token expired' }));
  });

  it('includes stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    const err = new Error('Dev error');
    errorHandler(err, {}, res, jest.fn());
    const call = res.json.mock.calls[0][0];
    expect(call.stack).toBeDefined();
    process.env.NODE_ENV = originalEnv;
  });

  it('does not include stack trace in test/production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const res = mockRes();
    errorHandler(new Error('Prod error'), {}, res, jest.fn());
    const call = res.json.mock.calls[0][0];
    expect(call.stack).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });
});
