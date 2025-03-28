const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content cannot be empty'],
    trim: true
  },
  originalLanguage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  },
  translations: [{
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language'
    },
    content: String,
    corrected: {
      type: Boolean,
      default: false
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    correctedContent: String
  }],
  read: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String,
    url: String,
    fileType: String
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'laugh', 'clap', 'confused', 'sad']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for quick fetching of conversation messages
MessageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
