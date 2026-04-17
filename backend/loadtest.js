const autocannon = require('autocannon');

const instance = autocannon({
  url: 'http://localhost:5000/api/jobs',
  connections: 50,
  duration: 10,
  headers: {
    // paste a real JWT here if testing protected routes
    // 'Authorization': 'Bearer <your_token>'
  },
  requests: [
    { method: 'GET', path: '/api/jobs?page=1&limit=10' },
  ]
}, (err, result) => {
  console.log(result);
});

autocannon.track(instance, { renderProgressBar: true });
