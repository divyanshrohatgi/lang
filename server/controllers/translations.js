const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Message = require('../models/Message');
const Language = require('../models/Language');
const fetch = require('node-fetch'); // install this package if needed

// @desc    Translate text using LibreTranslate
// @route   POST /api/translations/translate
// @access  Private
exports.translateText = asyncHandler(async (req, res, next) => {
  const { text, from, to } = req.body;

  if (!text || !to) {
    return next(new ErrorResponse('Please provide text and target language', 400));
  }

  try {
    // Use the public LibreTranslate instance. For self-hosting, change the URL accordingly.
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: from || 'auto',
        target: to,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate error: ${response.statusText}`);
    }

    const data = await response.json();

    res.status(200).json({
      success: true,
      data: {
        translatedText: data.translatedText,
        // LibreTranslate doesn't always provide a detected language; fallback to the provided value
        detectedSourceLanguage: from || 'auto',
        originalText: text
      }
    });
  } catch (err) {
    console.error('Translation error:', err);
    return next(new ErrorResponse('Error in translation service', 500));
  }
});

// @desc    Correct a translation
// @route   POST /api/translations/correct/:messageId
// @access  Private
exports.correctTranslation = asyncHandler(async (req, res, next) => {
  const { languageId, correctedContent } = req.body;

  if (!languageId || !correctedContent) {
    return next(new ErrorResponse('Please provide language ID and corrected content', 400));
  }

  // Find the message
  const message = await Message.findById(req.params.messageId);

  if (!message) {
    return next(new ErrorResponse(`Message not found with id of ${req.params.messageId}`, 404));
  }

  // Find the language
  const language = await Language.findById(languageId);

  if (!language) {
    return next(new ErrorResponse(`Language not found with id of ${languageId}`, 404));
  }

  // Find if translation for this language already exists
  const translationIndex = message.translations.findIndex(
    t => t.language.toString() === languageId
  );

  if (translationIndex === -1) {
    // If no translation exists, add a new one
    message.translations.push({
      language: languageId,
      content: correctedContent,
      corrected: true,
      correctedBy: req.user.id,
      correctedContent
    });
  } else {
    // Update existing translation
    message.translations[translationIndex].corrected = true;
    message.translations[translationIndex].correctedBy = req.user.id;
    message.translations[translationIndex].correctedContent = correctedContent;
  }

  await message.save();

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Get supported languages
// @route   GET /api/translations/languages
// @access  Private
exports.getSupportedLanguages = asyncHandler(async (req, res, next) => {
  const languages = await Language.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: languages.length,
    data: languages
  });
});
