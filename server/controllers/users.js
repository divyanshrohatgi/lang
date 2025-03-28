const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('nativeLanguages')
    .populate({
      path: 'learningLanguages.language',
      model: 'Language'
    });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user language proficiencies
// @route   PUT /api/users/languages
// @access  Private
exports.updateLanguages = asyncHandler(async (req, res, next) => {
  const { nativeLanguages, learningLanguages } = req.body;

  const updateFields = {};

  if (nativeLanguages) {
    updateFields.nativeLanguages = nativeLanguages;
  }

  if (learningLanguages) {
    updateFields.learningLanguages = learningLanguages;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateFields,
    {
      new: true,
      runValidators: true
    }
  )
  .populate('nativeLanguages')
  .populate({
    path: 'learningLanguages.language',
    model: 'Language'
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get language partners (recommendations)
// @route   GET /api/users/recommendations
// @access  Private
exports.getRecommendations = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('nativeLanguages')
    .populate({
      path: 'learningLanguages.language',
      model: 'Language'
    });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Get user's native and learning languages
  const nativeLanguageIds = user.nativeLanguages.map(lang => lang._id.toString());
  const learningLanguageIds = user.learningLanguages.map(item => item.language._id.toString());

  // Find users who are learning the languages that the current user knows natively
  // AND who know natively the languages that the current user is learning
  const recommendations = await User.find({
    _id: { $ne: user._id }, // Exclude current user
    $or: [
      // Users who are learning any of current user's native languages
      { 'learningLanguages.language': { $in: nativeLanguageIds } },
      // Users who know natively any of current user's learning languages
      { 'nativeLanguages': { $in: learningLanguageIds } }
    ]
  })
  .populate('nativeLanguages')
  .populate({
    path: 'learningLanguages.language',
    model: 'Language'
  })
  .limit(20);

  // Sort recommendations by best match (more language overlaps = better match)
  const sortedRecommendations = recommendations.map(rec => {
    // Calculate match score based on language overlaps
    let matchScore = 0;

    // Score for users learning current user's native languages
    rec.learningLanguages.forEach(lang => {
      if (nativeLanguageIds.includes(lang.language._id.toString())) {
        matchScore += 1;
      }
    });

    // Score for users who know natively current user's learning languages
    rec.nativeLanguages.forEach(lang => {
      if (learningLanguageIds.includes(lang._id.toString())) {
        matchScore += 1;
      }
    });

    return {
      user: rec,
      matchScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    count: sortedRecommendations.length,
    data: sortedRecommendations
  });
});

// @desc    Update profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
exports.updateProfilePicture = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePicture: req.body.profilePicture },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Add a connection
// @route   POST /api/users/connections/:id
// @access  Private
exports.addConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;

  // Make sure connection exists
  const connection = await User.findById(connectionId);
  if (!connection) {
    return next(new ErrorResponse(`User not found with id of ${connectionId}`, 404));
  }

  // Check if already connected
  const user = await User.findById(req.user.id);
  if (user.connections.includes(connectionId)) {
    return next(new ErrorResponse('Already connected with this user', 400));
  }

  // Add connection
  await User.findByIdAndUpdate(
    req.user.id,
    { $push: { connections: connectionId } },
    { new: true }
  );

  // Also add the current user to the other user's connections (mutual connection)
  await User.findByIdAndUpdate(
    connectionId,
    { $push: { connections: req.user.id } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Connection added successfully'
  });
});

// @desc    Remove a connection
// @route   DELETE /api/users/connections/:id
// @access  Private
exports.removeConnection = asyncHandler(async (req, res, next) => {
  const connectionId = req.params.id;

  // Remove connection
  await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { connections: connectionId } },
    { new: true }
  );

  // Also remove the current user from the other user's connections
  await User.findByIdAndUpdate(
    connectionId,
    { $pull: { connections: req.user.id } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Connection removed successfully'
  });
});

// @desc    Get user's connections
// @route   GET /api/users/connections
// @access  Private
exports.getConnections = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: 'connections',
    select: 'username profilePicture bio nativeLanguages learningLanguages isOnline lastActive',
    populate: [
      { path: 'nativeLanguages' },
      { path: 'learningLanguages.language' }
    ]
  });

  res.status(200).json({
    success: true,
    count: user.connections.length,
    data: user.connections
  });
});
