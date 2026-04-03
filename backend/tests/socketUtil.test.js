const mockEmitToRoom = jest.fn();
const mockIoEmit = jest.fn();
const mockIoTo = jest.fn(() => ({ emit: mockEmitToRoom }));
const mockIoUse = jest.fn();
const mockIoOn = jest.fn();

const mockServer = jest.fn(() => ({
  use: mockIoUse,
  on: mockIoOn,
  emit: mockIoEmit,
  to: mockIoTo,
}));

jest.mock('socket.io', () => ({ Server: mockServer }));

const mockVerify = jest.fn();
jest.mock('jsonwebtoken', () => ({ verify: (...args) => mockVerify(...args) }));

const mockUserSelect = jest.fn();
const mockFindUserById = jest.fn(() => ({ select: mockUserSelect }));
const mockUserUpdate = jest.fn(() => ({ catch: jest.fn() }));
jest.mock('../src/models/User.model', () => ({
  findById: (...args) => mockFindUserById(...args),
  findByIdAndUpdate: (...args) => mockUserUpdate(...args),
}));

const mockFindConversation = jest.fn();
const mockUpdateConversation = jest.fn();
jest.mock('../src/models/Conversation.model', () => ({
  findOne: (...args) => mockFindConversation(...args),
  findByIdAndUpdate: (...args) => mockUpdateConversation(...args),
}));

const mockCreateMessage = jest.fn();
const mockUpdateManyMessages = jest.fn();
jest.mock('../src/models/Message.model', () => ({
  create: (...args) => mockCreateMessage(...args),
  updateMany: (...args) => mockUpdateManyMessages(...args),
}));

const mockCreateNotification = jest.fn();
jest.mock('../src/utils/notification', () => ({
  createNotification: (...args) => mockCreateNotification(...args),
}));

const { initSocket, onlineUsers } = require('../src/utils/socket');

describe('utils/socket', () => {
  let authMiddleware;
  let connectionHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    onlineUsers.clear();
    initSocket({});
    authMiddleware = mockIoUse.mock.calls[0][0];
    connectionHandler = mockIoOn.mock.calls[0][1];
  });

  it('rejects auth when token is missing', async () => {
    const next = jest.fn();
    await authMiddleware({ handshake: { auth: {} } }, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects auth when user does not exist', async () => {
    const next = jest.fn();
    mockVerify.mockReturnValue({ id: 'u1' });
    mockUserSelect.mockResolvedValue(null);

    await authMiddleware({ handshake: { auth: { token: 't' } } }, next);
    expect(next.mock.calls[0][0].message).toMatch(/User not found/);
  });

  it('authenticates socket with valid token', async () => {
    const next = jest.fn();
    mockVerify.mockReturnValue({ id: 'u1' });
    mockUserSelect.mockResolvedValue({ _id: 'u1', name: 'Alice' });

    const socket = { handshake: { auth: { token: 't' } } };
    await authMiddleware(socket, next);
    expect(socket.user.name).toBe('Alice');
    expect(next).toHaveBeenCalledWith();
  });

  it('handles connection events, messaging and disconnect', async () => {
    const handlers = {};
    const socketToEmit = jest.fn();
    const socket = {
      id: 's1',
      user: { _id: { toString: () => 'u1' }, name: 'Alice' },
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn((event, cb) => { handlers[event] = cb; }),
      to: jest.fn(() => ({ emit: socketToEmit })),
    };

    const message = { _id: 'm1', conversationId: 'c1', populate: jest.fn().mockResolvedValue(true) };
    mockCreateMessage.mockResolvedValue(message);
    mockFindConversation.mockResolvedValue({
      _id: 'c1',
      participants: [{ toString: () => 'u1' }, { toString: () => 'u2' }],
    });

    connectionHandler(socket);
    expect(onlineUsers.get('u1')).toBe('s1');
    expect(socket.join).toHaveBeenCalledWith('u1');

    handlers.join_conversation('c1');
    handlers.leave_conversation('c1');
    expect(socket.join).toHaveBeenCalledWith('c1');
    expect(socket.leave).toHaveBeenCalledWith('c1');

    await handlers.send_message({ conversationId: 'c1', content: 'hello world' });
    expect(mockCreateMessage).toHaveBeenCalled();
    expect(mockIoTo).toHaveBeenCalledWith('u1');
    expect(mockIoTo).toHaveBeenCalledWith('u2');
    expect(mockCreateNotification).toHaveBeenCalled();

    await handlers.mark_read({ conversationId: 'c1' });
    expect(mockUpdateManyMessages).toHaveBeenCalled();
    expect(socketToEmit).toHaveBeenCalledWith('messages_read', { conversationId: 'c1', readBy: 'u1' });

    handlers.typing({ conversationId: 'c1' });
    handlers.stop_typing({ conversationId: 'c1' });
    expect(socketToEmit).toHaveBeenCalledWith('typing_indicator', expect.objectContaining({ conversationId: 'c1' }));
    expect(socketToEmit).toHaveBeenCalledWith('stop_typing_indicator', { userId: 'u1', conversationId: 'c1' });

    handlers.disconnect();
    expect(onlineUsers.has('u1')).toBe(false);
  });
});
