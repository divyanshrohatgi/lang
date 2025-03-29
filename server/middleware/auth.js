// const jwt = require('jsonwebtoken');
// const asyncHandler = require('./async');
// const ErrorResponse = require('../utils/errorResponse');
// const User = require('../models/User');

// // Protect routes
// exports.protect = asyncHandler(async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     // Get token from header
//     token = req.headers.authorization.split(' ')[1];
//   }

//   // Make sure token exists
//   if (!token) {
//     return next(new ErrorResponse('Not authorized to access this route', 401));
//   }

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Get user from the token
//     req.user = await User.findById(decoded.id);

//     if (!req.user) {
//       return next(new ErrorResponse('User not found', 404));
//     }

//     // Update lastActive
//     await User.findByIdAndUpdate(req.user.id, {
//       lastActive: Date.now()
//     });

//     next();
//   } catch (err) {
//     return next(new ErrorResponse('Not authorized to access this route', 401));
//   }
// });

// // Grant access to specific roles
// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user.role || !roles.includes(req.user.role)) {
//       return next(
//         new ErrorResponse(
//           `User role ${req.user.role} is not authorized to access this route`,
//           403
//         )
//       );
//     }
//     next();
//   };
// };
const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check headers for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Token must exist
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to req (for next middleware/controller)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Update lastActive
    currentUser.lastActive = Date.now();
    await currentUser.save({ validateBeforeSave: false });

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // If user has no role or the role is not in the allowed list, deny access
    if (!req.user.role || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
