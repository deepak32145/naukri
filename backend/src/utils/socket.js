const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Message = require('../models/Message.model');
const Conversation = require('../models/Conversation.model');
const { createNotification } = require('./notification');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Join personal room for notifications
    socket.join(userId);
    console.log(`User connected: ${socket.user.name} (${userId})`);

    // Broadcast online users
    io.emit('online_users', Array.from(onlineUsers.keys()));

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // Send message
    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });
        if (!conversation) return;

        const message = await Message.create({
          conversationId,
          sender: socket.user._id,
          content,
        });
        await message.populate('sender', 'name avatar');

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        // Emit to each participant's personal room so delivery is guaranteed
        // regardless of whether they have joined the conversation room
        for (const pId of conversation.participants) {
          io.to(pId.toString()).emit('receive_message', message);
        }

        // Notify offline participants
        const otherParticipants = conversation.participants.filter(
          p => p.toString() !== userId
        );
        for (const participantId of otherParticipants) {
          const pId = participantId.toString();
          // Increment unread
          await Conversation.findByIdAndUpdate(conversationId, {
            $inc: { [`unreadCount.${pId}`]: 1 },
          });
          // Notification
          await createNotification({
            userId: participantId,
            type: 'new_message',
            title: `New message from ${socket.user.name}`,
            body: content.substring(0, 100),
            link: '/chat',
            relatedId: conversation._id,
            io,
          });
        }
      } catch (err) {
        console.error('Socket send_message error:', err.message);
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('typing_indicator', {
        userId,
        name: socket.user.name,
        conversationId,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('stop_typing_indicator', { userId, conversationId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, sender: { $ne: socket.user._id }, isRead: false },
        { isRead: true }
      );
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCount.${userId}`]: 0 },
      });
      socket.to(conversationId).emit('messages_read', { conversationId, readBy: userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(console.error);
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = { initSocket, onlineUsers };
