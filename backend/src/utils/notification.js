const Notification = require('../models/Notification.model');

const createNotification = async ({ userId, type, title, body, link, relatedId, io }) => {
  try {
    const notification = await Notification.create({ userId, type, title, body, link, relatedId });
    if (io) {
      io.to(userId.toString()).emit('notification', notification);
    }
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error.message);
  }
};

module.exports = { createNotification };
