const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a language name'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please provide a language code'],
    unique: true,
    trim: true,
    minlength: [2, 'Language code must be at least 2 characters (ISO 639-1)'],
    maxlength: [3, 'Language code cannot be more than 3 characters']
  },
  nativeName: {
    type: String,
    required: [true, 'Please provide the native name of the language']
  },
  flag: {
    type: String,
    default: ''
  },
  popularity: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Language', LanguageSchema);
