const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const mongoose = require('mongoose');

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(new ErrorResponse(`Conversation not found with id of ${req.params.conversationId}`, 404));
  }

  // Check if user is part of the conversation
  if (!conversation.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this conversation', 401));
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;
  const startIndex = (page - 1) * limit;

  const messages = await Message.find({ conversation: req.params.conversationId })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit)
    .populate('sender', 'username profilePicture')
    .populate('originalLanguage')
    .populate({
      path: 'translations.language',
      model: 'Language'
    })
    .populate({
      path: 'translations.correctedBy',
      model: 'User',
      select: 'username profilePicture'
    });

  // Reverse to get oldest first
  messages.reverse();

  // Mark messages as read
  await Message.updateMany(
    {
      conversation: req.params.conversationId,
      sender: { $ne: req.user.id },
      read: false
    },
    { read: true }
  );

  // Reset unread count for this user
  const unreadMap = new Map(conversation.unreadCount);
  unreadMap.set(req.user.id.toString(), 0);

  await Conversation.findByIdAndUpdate(
    req.params.conversationId,
    { unreadCount: unreadMap }
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Send a message
// @route   POST /api/messages/:conversationId
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { content, originalLanguage, attachments } = req.body;
  const conversationId = req.params.conversationId;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new ErrorResponse(`Conversation not found with id of ${conversationId}`, 404));
  }

  // Check if user is part of the conversation
  if (!conversation.participants.includes(req.user.id)) {
    return next(new ErrorResponse('Not authorized to access this conversation', 401));
  }

  // Create message
  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    content,
    originalLanguage,
    attachments: attachments || []
  });

  // Populate message for response
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username profilePicture')
    .populate('originalLanguage')
    .populate({
      path: 'translations.language',
      model: 'Language'
    });

  // Update conversation with last message
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id
  });

  // Increment unread count for all participants except sender
  const unreadMap = new Map(conversation.unreadCount);

  conversation.participants.forEach(participant => {
    if (participant.toString() !== req.user.id.toString()) {
      const currentCount = unreadMap.get(participant.toString()) || 0;
      unreadMap.set(participant.toString(), currentCount + 1);
    }
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    unreadCount: unreadMap
  });

  res.status(201).json({
    success: true,
    data: populatedMessage
  });
});

// @desc    Delete a message (mark as deleted)
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(new ErrorResponse(`Message not found with id of ${req.params.id}`, 404));
  }

  // Check if user is the sender or has admin rights
  if (message.sender.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this message', 401));
  }

  await message.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: req.user.id
  })
    .sort({ updatedAt: -1 })
    .populate('participants', 'username profilePicture isOnline lastActive')
    .populate('lastMessage')
    .populate('mainLanguage');

  // Add unread count for current user to each conversation
  const conversationsWithUnreadCount = conversations.map(conv => {
    const unreadCount = conv.unreadCount.get(req.user.id.toString()) || 0;

    // For direct messages, find the other participant
    let otherParticipant = null;
    if (!conv.isGroup && conv.participants.length === 2) {
      otherParticipant = conv.participants.find(
        p => p._id.toString() !== req.user.id
      );
    }

    return {
      ...conv.toObject(),
      unreadCount,
      otherParticipant
    };
  });

  res.status(200).json({
    success: true,
    count: conversations.length,
    data: conversationsWithUnreadCount
  });
});

// @desc    Create or get conversation
// @route   POST /api/messages/conversations
// @access  Private
exports.createConversation = asyncHandler(async (req, res, next) => {
  const { participants, isGroup, name, mainLanguage } = req.body;

  // Make sure user is included in the participants
  let allParticipants = [...participants];
  if (!allParticipants.includes(req.user.id)) {
    allParticipants.push(req.user.id);
  }

  // Remove duplicates
  allParticipants = [...new Set(allParticipants)];

  // If direct message (not a group), check if conversation already exists
  if (!isGroup && allParticipants.length === 2) {
    const existingConversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: allParticipants, $size: 2 }
    })
      .populate('participants', 'username profilePicture isOnline lastActive')
      .populate('lastMessage')
      .populate('mainLanguage');

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        data: existingConversation
      });
    }
  }

  // For groups, name is required
  if (isGroup && !name) {
    return next(new ErrorResponse('Please add a name for the group conversation', 400));
  }

  // Initialize unread count map
  const unreadCount = new Map();
  allParticipants.forEach(participant => {
    unreadCount.set(participant.toString(), 0);
  });

  // Create conversation
  const conversation = await Conversation.create({
    participants: allParticipants,
    isGroup: isGroup || false,
    name: name,
    mainLanguage,
    groupAdmin: isGroup ? req.user.id : undefined,
    unreadCount
  });

  const populatedConversation = await Conversation.findById(conversation._id)
    .populate('participants', 'username profilePicture isOnline lastActive')
    .populate('mainLanguage');

  res.status(201).json({
    success: true,
    data: populatedConversation
  });
});
