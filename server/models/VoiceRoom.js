const mongoose = require('mongoose');

const VoiceRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a room name'],
    trim: true,
    maxlength: [50, 'Room name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    isDeafened: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false
  },
  languages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  }],
  maxParticipants: {
    type: Number,
    default: 10
  },
  topic: {
    type: String,
    enum: ['casual', 'formal', 'practice', 'learning', 'teaching', 'discussion', 'debate', 'other'],
    default: 'casual'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  recordings: [{
    url: String,
    startTime: Date,
    endTime: Date,
    size: Number
  }]
}, {
  timestamps: true
});

// Index for quick search by language, topic, and isActive status
VoiceRoomSchema.index({ languages: 1, topic: 1, isActive: 1 });

// Index for finding rooms by host
VoiceRoomSchema.index({ host: 1 });

module.exports = mongoose.model('VoiceRoom', VoiceRoomSchema);
