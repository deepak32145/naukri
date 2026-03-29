const { Worker } = require('bullmq');
const { sendEmail } = require('../utils/email');
const { getRedisConnection } = require('../config/emailQueue');

let worker = null;

const startEmailWorker = () => {
  if (process.env.NODE_ENV === 'test') return;

  worker = new Worker(
    'email',
    async (job) => {
      const { to, subject, html } = job.data;
      await sendEmail({ to, subject, html });
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✉  Email sent → ${job.data.to}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`✉  Email failed [attempt ${job.attemptsMade}] → ${job.data.to}: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('Email worker error:', err.message);
  });

  console.log('Email worker started');
  return worker;
};

module.exports = { startEmailWorker };
