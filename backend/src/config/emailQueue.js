const { Queue } = require('bullmq');

// BullMQ requires ioredis-style connection (host/port), not the redis npm client
const getRedisConnection = () => {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const parsed = new URL(url);
  return {
    host: parsed.hostname || '127.0.0.1',
    port: Number(parsed.port) || 6379,
    maxRetriesPerRequest: null, // required by BullMQ
  };
};

let emailQueue = null;

const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = new Queue('email', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 500,
      },
    });
    emailQueue.on('error', (err) => {
      console.warn('Email queue unavailable (Redis down?) — falling back to direct send:', err.message);
      emailQueue = null; // reset so next call recreates it once Redis is back
    });
  }
  return emailQueue;
};

module.exports = { getEmailQueue, getRedisConnection };
