const Language = require('../models/Language');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all languages
// @route   GET /api/languages
// @access  Private
exports.getLanguages = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single language
// @route   GET /api/languages/:id
// @access  Private
exports.getLanguage = asyncHandler(async (req, res, next) => {
  const language = await Language.findById(req.params.id);

  if (!language) {
    return next(new ErrorResponse(`Language not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: language
  });
});

// @desc    Create new language
// @route   POST /api/languages
// @access  Private (Admin only in a real app)
exports.createLanguage = asyncHandler(async (req, res, next) => {
  const language = await Language.create(req.body);

  res.status(201).json({
    success: true,
    data: language
  });
});

// @desc    Update language
// @route   PUT /api/languages/:id
// @access  Private (Admin only in a real app)
exports.updateLanguage = asyncHandler(async (req, res, next) => {
  const language = await Language.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!language) {
    return next(new ErrorResponse(`Language not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: language
  });
});

// @desc    Delete language
// @route   DELETE /api/languages/:id
// @access  Private (Admin only in a real app)
exports.deleteLanguage = asyncHandler(async (req, res, next) => {
  const language = await Language.findById(req.params.id);

  if (!language) {
    return next(new ErrorResponse(`Language not found with id of ${req.params.id}`, 404));
  }

  await language.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
