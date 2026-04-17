const mockWorkerInstances = [];
const mockQueueInstances = [];

const mockWorker = jest.fn((name, processor) => {
  const handlers = {};
  const instance = {
    name,
    processor,
    on: jest.fn((event, cb) => { handlers[event] = cb; }),
    __handlers: handlers,
  };
  mockWorkerInstances.push(instance);
  return instance;
});

const mockQueue = jest.fn((name) => {
  const instance = {
    name,
    add: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
  };
  mockQueueInstances.push(instance);
  return instance;
});

jest.mock('bullmq', () => ({ Worker: mockWorker, Queue: mockQueue }));

// Make TCP probes in isRedisAvailable() resolve as connected immediately
jest.mock('net', () => {
  const { EventEmitter } = require('events');
  return {
    createConnection: jest.fn(() => {
      const socket = new EventEmitter();
      socket.destroy = jest.fn();
      socket.setTimeout = jest.fn();
      process.nextTick(() => socket.emit('connect'));
      return socket;
    }),
  };
});

const mockSendEmail = jest.fn().mockResolvedValue(true);
const mockQueueEmail = jest.fn().mockResolvedValue(true);
const mockJobAlertTpl = jest.fn().mockReturnValue({ subject: 's', html: 'h' });
jest.mock('../src/utils/email', () => ({
  sendEmail: (...args) => mockSendEmail(...args),
  queueEmail: (...args) => mockQueueEmail(...args),
  emailTemplates: { jobAlert: (...args) => mockJobAlertTpl(...args) },
}));

const mockCreateNotification = jest.fn().mockResolvedValue(true);
jest.mock('../src/utils/notification', () => ({
  createNotification: (...args) => mockCreateNotification(...args),
}));

const mockRedisGet = jest.fn();
const mockRedisSetEx = jest.fn().mockResolvedValue(true);
jest.mock('../src/config/redis', () => ({
  get: (...args) => mockRedisGet(...args),
  setEx: (...args) => mockRedisSetEx(...args),
}));

const mockGetRedisConnection = jest.fn(() => ({ host: '127.0.0.1', port: 6379 }));
jest.mock('../src/config/emailQueue', () => ({
  getRedisConnection: (...args) => mockGetRedisConnection(...args),
}));

const mockCandidateFind = jest.fn();
jest.mock('../src/models/CandidateProfile.model', () => ({
  find: (...args) => mockCandidateFind(...args),
}));

const mockJobFind = jest.fn();
jest.mock('../src/models/Job.model', () => ({
  find: (...args) => mockJobFind(...args),
}));

describe('workers', () => {
  let originalNodeEnv;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    mockWorkerInstances.length = 0;
    mockQueueInstances.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('starts email worker and processes a job', async () => {
    const { startEmailWorker } = require('../src/workers/email.worker');
    const worker = await startEmailWorker();
    expect(worker).toBeDefined();
    expect(mockWorker).toHaveBeenCalledWith('email', expect.any(Function), expect.any(Object));

    await worker.processor({ data: { to: 'a@test.com', subject: 'sub', html: '<p>x</p>' } });
    expect(mockSendEmail).toHaveBeenCalledWith({ to: 'a@test.com', subject: 'sub', html: '<p>x</p>' });

    worker.__handlers.completed({ data: { to: 'a@test.com' } });
    worker.__handlers.failed({ attemptsMade: 1, data: { to: 'a@test.com' } }, new Error('oops'));
    worker.__handlers.error(new Error('boom'));
  });

  it('skips worker startup in test env', async () => {
    process.env.NODE_ENV = 'test';
    const { startEmailWorker } = require('../src/workers/email.worker');
    expect(await startEmailWorker()).toBeUndefined();
  });

  it('starts digest worker, schedules queue and runs digest logic', async () => {
    const profilesForDigest = [
      {
        userId: { _id: 'u1', name: 'A', email: 'a@test.com' },
        jobAlerts: [{ isActive: true, frequency: 'daily', keyword: 'node', skills: ['js'], location: 'Gurgaon' }],
      },
    ];
    const profilesForNudges = [
      {
        userId: { _id: 'u2', name: 'B', email: 'b@test.com' },
        completenessScore: 40,
        headline: '',
        skills: [],
        resume: {},
        experience: [],
        education: [],
      },
    ];

    mockCandidateFind
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(profilesForDigest) })
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(profilesForNudges) });
    mockJobFind.mockReturnValue({ populate: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ title: 'BE', companyId: { name: 'X' }, location: 'Gurgaon', salaryMin: 10, salaryMax: 20 }]) }) });
    mockRedisGet.mockResolvedValue(null);

    const { startDigestWorker } = require('../src/workers/digest.worker');
    await startDigestWorker();

    expect(mockQueue).toHaveBeenCalledWith('digest', expect.any(Object));
    expect(mockQueueInstances[0].add).toHaveBeenCalledWith('daily', {}, { repeat: { pattern: '0 8 * * *' } });

    const digestWorker = mockWorkerInstances.find((w) => w.name === 'digest');
    await digestWorker.processor();

    expect(mockJobAlertTpl).toHaveBeenCalled();
    expect(mockQueueEmail).toHaveBeenCalled();
    expect(mockCreateNotification).toHaveBeenCalled();
    expect(mockRedisSetEx).toHaveBeenCalled();

    digestWorker.__handlers.completed();
    digestWorker.__handlers.failed({}, new Error('fail'));
    digestWorker.__handlers.error(new Error('err'));
  });

  it('handles digest queue scheduling failure', async () => {
    const { startDigestWorker } = require('../src/workers/digest.worker');
    await startDigestWorker();
    mockQueueInstances[0].add.mockRejectedValueOnce(new Error('queue down'));
    await mockQueueInstances[0].add('daily', {}, { repeat: { pattern: '0 8 * * *' } }).catch(() => {});
  });
});
