const Conversation = require('../models/Conversation.model');
const Message = require('../models/Message.model');
const { createNotification } = require('../utils/notification');

let io;
const setIo = (socketIo) => { io = socketIo; };

// @GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatar role lastSeen')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/chat/conversations
const startConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ success: false, message: 'participantId required' });

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 },
    }).populate('participants', 'name avatar role lastSeen').populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, participantId] });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar role lastSeen')
        .populate('lastMessage');
    }

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/chat/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversationId: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversationId: req.params.id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );
    // Reset unread count
    await Conversation.findByIdAndUpdate(req.params.id, {
      $set: { [`unreadCount.${req.user._id}`]: 0 },
    });

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/chat/conversations/:id/messages  (REST fallback)
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const message = await Message.create({
      conversationId: req.params.id,
      sender: req.user._id,
      content,
    });
    await message.populate('sender', 'name avatar');

    // Update conversation
    await Conversation.findByIdAndUpdate(req.params.id, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    // Increment unread for other participants
    const otherParticipants = conversation.participants.filter(p => p.toString() !== req.user._id.toString());
    for (const participantId of otherParticipants) {
      const currentCount = conversation.unreadCount?.get?.(participantId.toString()) || 0;
      await Conversation.findByIdAndUpdate(req.params.id, {
        $set: { [`unreadCount.${participantId}`]: currentCount + 1 },
      });
      await createNotification({
        userId: participantId,
        type: 'new_message',
        title: `New message from ${req.user.name}`,
        body: content.substring(0, 100),
        link: `/chat`,
        relatedId: conversation._id,
        io,
      });
    }

    if (io) {
      for (const pId of conversation.participants) {
        io.to(pId.toString()).emit('receive_message', message);
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { setIo, getConversations, startConversation, getMessages, sendMessage };
