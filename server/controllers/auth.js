// const User = require('../models/User');
// const ErrorResponse = require('../utils/errorResponse');
// const asyncHandler = require('../middleware/async');
// const crypto = require('crypto');

// // @desc    Register user
// // @route   POST /api/auth/register
// // @access  Public
// exports.register = asyncHandler(async (req, res, next) => {
//   const { username, email, password } = req.body;

//   // Create user
//   const user = await User.create({
//     username,
//     email,
//     password
//   });

//   sendTokenResponse(user, 201, res);
// });

// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// exports.login = asyncHandler(async (req, res, next) => {
//   const { email, password } = req.body;

//   // Validate email & password
//   if (!email || !password) {
//     return next(new ErrorResponse('Please provide an email and password', 400));
//   }

//   // Check for user
//   const user = await User.findOne({ email }).select('+password');

//   if (!user) {
//     return next(new ErrorResponse('Invalid credentials', 401));
//   }

//   // Check if password matches
//   const isMatch = await user.matchPassword(password);

//   if (!isMatch) {
//     return next(new ErrorResponse('Invalid credentials', 401));
//   }

//   // Update lastActive and isOnline
//   user.lastActive = Date.now();
//   user.isOnline = true;
//   await user.save({ validateBeforeSave: false });

//   sendTokenResponse(user, 200, res);
// });

// // @desc    Log user out / clear cookie
// // @route   GET /api/auth/logout
// // @access  Private
// exports.logout = asyncHandler(async (req, res, next) => {
//   // Update user status
//   if (req.user && req.user.id) {
//     await User.findByIdAndUpdate(req.user.id, {
//       isOnline: false,
//       lastActive: Date.now()
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: {}
//   });
// });

// // @desc    Get current logged in user
// // @route   GET /api/auth/me
// // @access  Private
// exports.getMe = asyncHandler(async (req, res, next) => {
//   // user is already available in req.user due to the protect middleware
//   const user = await User.findById(req.user.id)
//     .populate('nativeLanguages')
//     .populate({
//       path: 'learningLanguages.language',
//       model: 'Language'
//     });

//   res.status(200).json({
//     success: true,
//     data: user
//   });
// });

// // @desc    Update user details
// // @route   PUT /api/auth/updatedetails
// // @access  Private
// exports.updateDetails = asyncHandler(async (req, res, next) => {
//   const fieldsToUpdate = {
//     username: req.body.username,
//     email: req.body.email,
//     bio: req.body.bio,
//     interests: req.body.interests,
//     location: req.body.location
//   };

//   // Remove undefined fields
//   Object.keys(fieldsToUpdate).forEach(key =>
//     fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
//   );

//   const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
//     new: true,
//     runValidators: true
//   });

//   res.status(200).json({
//     success: true,
//     data: user
//   });
// });

// // @desc    Update password
// // @route   PUT /api/auth/updatepassword
// // @access  Private
// exports.updatePassword = asyncHandler(async (req, res, next) => {
//   const user = await User.findById(req.user.id).select('+password');

//   // Check current password
//   if (!(await user.matchPassword(req.body.currentPassword))) {
//     return next(new ErrorResponse('Password is incorrect', 401));
//   }

//   user.password = req.body.newPassword;
//   await user.save();

//   sendTokenResponse(user, 200, res);
// });

// // @desc    Forgot password
// // @route   POST /api/auth/forgotpassword
// // @access  Public
// exports.forgotPassword = asyncHandler(async (req, res, next) => {
//   const user = await User.findOne({ email: req.body.email });

//   if (!user) {
//     return next(new ErrorResponse('There is no user with that email', 404));
//   }

//   // Get reset token
//   const resetToken = crypto.randomBytes(20).toString('hex');

//   // Hash token and set to resetPasswordToken field
//   user.resetPasswordToken = crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');

//   // Set expire
//   user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

//   await user.save({ validateBeforeSave: false });

//   // In a real app, you would send an email with the token
//   // For this demo, we'll just return the token
//   res.status(200).json({
//     success: true,
//     resetToken
//   });
// });

// // @desc    Reset password
// // @route   PUT /api/auth/resetpassword/:resettoken
// // @access  Public
// exports.resetPassword = asyncHandler(async (req, res, next) => {
//   // Get hashed token
//   const resetPasswordToken = crypto
//     .createHash('sha256')
//     .update(req.params.resettoken)
//     .digest('hex');

//   const user = await User.findOne({
//     resetPasswordToken,
//     resetPasswordExpire: { $gt: Date.now() }
//   });

//   if (!user) {
//     return next(new ErrorResponse('Invalid token', 400));
//   }

//   // Set new password
//   user.password = req.body.password;
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpire = undefined;
//   await user.save();

//   sendTokenResponse(user, 200, res);
// });

// // Helper function to get token from model, create cookie and send response
// const sendTokenResponse = (user, statusCode, res) => {
//   // Create token
//   const token = user.getSignedJwtToken();

//   // In your auth.js controller
// try {
//   // Registration code
// } catch (error) {
//   if (error.code === 11000) {
//     return res.status(400).json({ 
//       message: "Email already exists. Please use a different email or login to your existing account." 
//     });
//   }
//   // Handle other errors
//   res.status(500).json({ message: "Server error", error: error.message });
// }
//   res.status(statusCode).json({
//     success: true,
//     token,
//     user: {
//       id: user._id,
//       username: user.username,
//       email: user.email,
//       profilePicture: user.profilePicture
//     }
//   });
// };
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Create user
    const user = await User.create({ username, email, password });

    // Return token + user info
    sendTokenResponse(user, 201, res);
  } catch (error) {
    // Handle duplicate key error (e.g., email or username already exists)
    if (error.code === 11000) {
      return next(
        new ErrorResponse(
          'Email or username already exists. Please use a different one.',
          400
        )
      );
    }
    // Pass any other errors to error handler
    return next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user (include password for comparison)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update lastActive and isOnline
  user.lastActive = Date.now();
  user.isOnline = true;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie (or just set isOnline=false)
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.id) {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastActive: Date.now()
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // user is available in req.user (set in protect middleware)
  const user = await User.findById(req.user.id)
    .populate('nativeLanguages')
    .populate({
      path: 'learningLanguages.language',
      model: 'Language'
    });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.username,
    email: req.body.email,
    bio: req.body.bio,
    interests: req.body.interests,
    location: req.body.location
  };

  // Remove undefined fields so they don't overwrite existing data
  Object.keys(fieldsToUpdate).forEach(
    (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Generate reset token (this example returns it directly)
  const resetToken = crypto.randomBytes(20).toString('hex');

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // In production, you'd send an email to the user with the resetToken link
  res.status(200).json({
    success: true,
    resetToken
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash the token from the URL
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * Helper function to create a JWT token from the user model,
 * then return a JSON response containing the token and user info.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture
    }
  });
};
