const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [20, 'Username cannot be more than 20 characters long']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    profilePicture: {
      type: String,
      default: 'default-avatar.png'
    },
    bio: {
      type: String,
      maxlength: [250, 'Bio cannot be more than 250 characters long']
    },
    nativeLanguages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language'
      }
    ],
    learningLanguages: [
      {
        language: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Language'
        },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'fluent'],
          default: 'beginner'
        }
      }
    ],
    interests: [String],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    location: {
      country: String,
      city: String
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

// Pre-save middleware: hash password if modified or new
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return the token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
