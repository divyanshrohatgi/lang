const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  name: {
    type: String,
    // Required for group conversations, optional for direct conversations
    required: function() {
      return this.isGroup === true;
    }
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Required if isGroup is true
    required: function() {
      return this.isGroup === true;
    }
  },
  mainLanguage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create unique index for participants to prevent duplicate conversations between the same users
ConversationSchema.index({ participants: 1 }, { unique: true, partialFilterExpression: { isGroup: false } });

// Index for easier finding conversations for a specific user
ConversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
