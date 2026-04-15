const { Worker } = require('bullmq');
const { sendEmail } = require('../utils/email');
const { getRedisConnection } = require('../config/emailQueue');

// TCP probe — resolves true only if Redis port is open
const isRedisAvailable = (host, port) =>
  new Promise((resolve) => {
    const net = require('net');
    const socket = net.createConnection({ host, port });
    socket.setTimeout(2000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });

const startEmailWorker = async () => {
  if (process.env.NODE_ENV === 'test') return;

  const conn = getRedisConnection();
  const available = await isRedisAvailable(conn.host, conn.port);
  if (!available) {
    console.log('Redis unavailable — email worker skipped (direct-send fallback active)');
    return;
  }

  const worker = new Worker(
    'email',
    async (job) => {
      const { to, subject, html } = job.data;
      await sendEmail({ to, subject, html });
    },
    { connection: conn, concurrency: 5 }
  );

  worker.on('completed', (job) => console.log(`✉  Email sent → ${job.data.to}`));
  worker.on('failed', (job, err) =>
    console.error(`✉  Email failed [attempt ${job.attemptsMade}] → ${job.data.to}: ${err.message}`)
  );
  worker.on('error', (err) => console.error('Email worker error:', err.message));

  console.log('Email worker started');
  return worker;
};

module.exports = { startEmailWorker };
