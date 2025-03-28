const VoiceRoom = require('../models/VoiceRoom');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all voice rooms
// @route   GET /api/voice-rooms
// @access  Private
exports.getVoiceRooms = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single voice room
// @route   GET /api/voice-rooms/:id
// @access  Private
exports.getVoiceRoom = asyncHandler(async (req, res, next) => {
  const voiceRoom = await VoiceRoom.findById(req.params.id)
    .populate('host', 'username profilePicture')
    .populate('participants.user', 'username profilePicture')
    .populate('languages');

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: voiceRoom
  });
});

// @desc    Create new voice room
// @route   POST /api/voice-rooms
// @access  Private
exports.createVoiceRoom = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.host = req.user.id;

  // Add user as first participant
  req.body.participants = [{
    user: req.user.id,
    isMuted: false,
    isDeafened: false
  }];

  const voiceRoom = await VoiceRoom.create(req.body);

  res.status(201).json({
    success: true,
    data: voiceRoom
  });
});

// @desc    Update voice room
// @route   PUT /api/voice-rooms/:id
// @access  Private
exports.updateVoiceRoom = asyncHandler(async (req, res, next) => {
  let voiceRoom = await VoiceRoom.findById(req.params.id);

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is room owner
  if (voiceRoom.host.toString() !== req.user.id) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this room`, 401));
  }

  // Fields that cannot be updated
  delete req.body.host;
  delete req.body.participants;

  voiceRoom = await VoiceRoom.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: voiceRoom
  });
});

// @desc    Delete voice room
// @route   DELETE /api/voice-rooms/:id
// @access  Private
exports.deleteVoiceRoom = asyncHandler(async (req, res, next) => {
  const voiceRoom = await VoiceRoom.findById(req.params.id);

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is room owner
  if (voiceRoom.host.toString() !== req.user.id) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this room`, 401));
  }

  await voiceRoom.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Join voice room
// @route   POST /api/voice-rooms/:id/join
// @access  Private
exports.joinVoiceRoom = asyncHandler(async (req, res, next) => {
  const voiceRoom = await VoiceRoom.findById(req.params.id);

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  // Check if user is already in the room
  const isAlreadyJoined = voiceRoom.participants.some(
    participant => participant.user.toString() === req.user.id
  );

  if (isAlreadyJoined) {
    return next(new ErrorResponse('User is already in this voice room', 400));
  }

  // Check if room is at capacity
  if (voiceRoom.participants.length >= voiceRoom.maxParticipants) {
    return next(new ErrorResponse('Voice room is at full capacity', 400));
  }

  // If room is private, check for password
  if (voiceRoom.isPrivate) {
    // Get the room with password field
    const privateRoom = await VoiceRoom.findById(req.params.id).select('+password');

    // Check if password was provided and matches
    if (!req.body.password || req.body.password !== privateRoom.password) {
      return next(new ErrorResponse('Invalid or missing password for private room', 401));
    }
  }

  // Add user to participants
  voiceRoom.participants.push({
    user: req.user.id,
    isMuted: false,
    isDeafened: false,
    joinedAt: Date.now()
  });

  await voiceRoom.save();

  res.status(200).json({
    success: true,
    data: voiceRoom
  });
});

// @desc    Leave voice room
// @route   POST /api/voice-rooms/:id/leave
// @access  Private
exports.leaveVoiceRoom = asyncHandler(async (req, res, next) => {
  const voiceRoom = await VoiceRoom.findById(req.params.id);

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  // Check if user is in the room
  const participantIndex = voiceRoom.participants.findIndex(
    participant => participant.user.toString() === req.user.id
  );

  if (participantIndex === -1) {
    return next(new ErrorResponse('User is not in this voice room', 400));
  }

  // Remove user from participants
  voiceRoom.participants.splice(participantIndex, 1);

  // If the host leaves and there are other participants, transfer ownership
  if (voiceRoom.host.toString() === req.user.id && voiceRoom.participants.length > 0) {
    voiceRoom.host = voiceRoom.participants[0].user;
  }

  // If room is now empty, close it
  if (voiceRoom.participants.length === 0) {
    voiceRoom.isActive = false;
    voiceRoom.endTime = Date.now();
  }

  await voiceRoom.save();

  res.status(200).json({
    success: true,
    data: voiceRoom
  });
});

// @desc    Toggle mute status
// @route   POST /api/voice-rooms/:id/toggle-mute
// @access  Private
exports.toggleMute = asyncHandler(async (req, res, next) => {
  const voiceRoom = await VoiceRoom.findById(req.params.id);

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  // Find participant
  const participant = voiceRoom.participants.find(
    p => p.user.toString() === req.user.id
  );

  if (!participant) {
    return next(new ErrorResponse('User is not in this voice room', 400));
  }

  // Toggle mute status
  participant.isMuted = !participant.isMuted;

  await voiceRoom.save();

  res.status(200).json({
    success: true,
    data: {
      isMuted: participant.isMuted
    }
  });
});

// @desc    Toggle deafened status
// @route   POST /api/voice-rooms/:id/toggle-deafen
// @access  Private
exports.toggleDeafen = asyncHandler(async (req, res, next) => {
  const voiceRoom = await VoiceRoom.findById(req.params.id);

  if (!voiceRoom) {
    return next(new ErrorResponse(`Voice room not found with id of ${req.params.id}`, 404));
  }

  // Find participant
  const participant = voiceRoom.participants.find(
    p => p.user.toString() === req.user.id
  );

  if (!participant) {
    return next(new ErrorResponse('User is not in this voice room', 400));
  }

  // Toggle deafened status
  participant.isDeafened = !participant.isDeafened;

  // If undeafening, ensure user is not muted
  if (!participant.isDeafened) {
    participant.isMuted = false;
  }

  await voiceRoom.save();

  res.status(200).json({
    success: true,
    data: {
      isDeafened: participant.isDeafened,
      isMuted: participant.isMuted
    }
  });
});
