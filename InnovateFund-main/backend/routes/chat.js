import express from 'express';
import { Chat, Message } from '../models/Chat.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { io } from '../server.js';

const router = express.Router();

// Get all chats for current user
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'name profilePicture lastActive')
      .populate('lastMessage')
      .sort({ lastActivity: -1 });

    res.json({ chats });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create chat between users
router.post('/create', async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] },
      isGroupChat: false
    }).populate('participants', 'name profilePicture lastActive');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user._id, participantId],
        isGroupChat: false
      });

      await chat.save();
      await chat.populate('participants', 'name profilePicture lastActive');
    }

    res.json({ chat });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ chat: req.params.chatId });

    res.json({
      messages: messages.reverse(),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/messages', validateRequest(schemas.sendMessage), async (req, res) => {
  try {
    const { content, messageType = 'text' } = req.body;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      content,
      messageType,
      readBy: [{ user: req.user._id }]
    });

    await message.save();
    await message.populate('sender', 'name profilePicture');

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    // Emit to other participants via Socket.IO
    const otherParticipants = chat.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );

    otherParticipants.forEach(participantId => {
      io.to(`user_${participantId}`).emit('new_message', {
        chatId,
        message
      });
    });

    res.status(201).json({ message });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Message.updateMany(
      { 
        chat: chatId,
        'readBy.user': { $ne: req.user._id }
      },
      { 
        $push: { readBy: { user: req.user._id, readAt: new Date() } }
      }
    );

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;