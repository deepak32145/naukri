require('dotenv').config();
const http = require('http');
const morgan = require('morgan');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/utils/socket');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

connectDB();

const server = http.createServer(app);
const io = initSocket(server);

// Inject io into controllers that need real-time events
const applicationController = require('./src/controllers/application.controller');
applicationController.setIo(io);
const chatController = require('./src/controllers/chat.controller');
chatController.setIo(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
