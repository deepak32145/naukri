const jwt = require('jsonwebtoken');

describe('utils/generateToken', () => {
  const originalExpiry = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    process.env.JWT_EXPIRES_IN = originalExpiry;
    jest.restoreAllMocks();
  });

  it('uses custom JWT_EXPIRES_IN when provided', () => {
    process.env.JWT_EXPIRES_IN = '3h';
    const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token');
    const { generateToken } = require('../src/utils/generateToken');
    generateToken('u1');
    expect(signSpy).toHaveBeenCalledWith(
      { id: 'u1' },
      process.env.JWT_SECRET,
      expect.objectContaining({ expiresIn: '3h' })
    );
  });

  it('falls back to 7d when JWT_EXPIRES_IN is missing', () => {
    delete process.env.JWT_EXPIRES_IN;
    const signSpy = jest.spyOn(jwt, 'sign').mockReturnValue('token');
    const { generateToken } = require('../src/utils/generateToken');
    generateToken('u2');
    expect(signSpy).toHaveBeenCalledWith(
      { id: 'u2' },
      process.env.JWT_SECRET,
      expect.objectContaining({ expiresIn: '7d' })
    );
  });
});

describe('utils/notification', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns created notification and emits via io', async () => {
    const createMock = jest.fn().mockResolvedValue({ _id: 'n1' });
    jest.doMock('../src/models/Notification.model', () => ({ create: (...args) => createMock(...args) }));
    const { createNotification } = require('../src/utils/notification');

    const io = { to: jest.fn(() => ({ emit: jest.fn() })) };
    const result = await createNotification({
      userId: { toString: () => 'u1' },
      type: 't',
      title: 'title',
      body: 'body',
      link: '/x',
      relatedId: 'r1',
      io,
    });

    expect(result).toEqual({ _id: 'n1' });
    expect(createMock).toHaveBeenCalled();
    expect(io.to).toHaveBeenCalledWith('u1');
  });

  it('handles create errors gracefully', async () => {
    const createMock = jest.fn().mockRejectedValue(new Error('db fail'));
    jest.doMock('../src/models/Notification.model', () => ({ create: (...args) => createMock(...args) }));
    const { createNotification } = require('../src/utils/notification');

    await expect(createNotification({ userId: 'u1', type: 't', title: 'x', body: 'y' })).resolves.toBeUndefined();
  });
});
