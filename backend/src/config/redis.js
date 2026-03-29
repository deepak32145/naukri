const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    // Stop retrying after 3 attempts so dev startup isn't blocked
    reconnectStrategy: (retries) => (retries >= 3 ? false : Math.min(retries * 100, 3000)),
  },
});

client.on('error', () => {
  // Silently ignore — helpers below check isReady before every call
});

if (process.env.NODE_ENV !== 'test') {
  client.connect().catch(() => {
    // Redis unavailable — app still works, just without cache
  });
}

// ── Safe wrappers ─────────────────────────────────────────────────────────────
// Each wrapper checks isReady first, so the app degrades gracefully when
// Redis is down instead of throwing errors.

const get = async (key) => {
  if (!client.isReady) return null;
  return client.get(key);
};

const setEx = async (key, ttl, value) => {
  if (!client.isReady) return;
  return client.setEx(key, ttl, value);
};

// del accepts an array of keys
const del = async (keys) => {
  if (!client.isReady || !keys || keys.length === 0) return;
  return client.del(keys);
};

const keys = async (pattern) => {
  if (!client.isReady) return [];
  return client.keys(pattern);
};

module.exports = { get, setEx, del, keys };
