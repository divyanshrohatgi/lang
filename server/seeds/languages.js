const mongoose = require('mongoose');
const Language = require('../models/Language');
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/language-exchange');

// Language data
const languages = [
  {
    name: 'English',
    code: 'en',
    nativeName: 'English',
    flag: '🇬🇧',
    popularity: 1000
  },
  {
    name: 'Spanish',
    code: 'es',
    nativeName: 'Español',
    flag: '🇪🇸',
    popularity: 900
  },
  {
    name: 'French',
    code: 'fr',
    nativeName: 'Français',
    flag: '🇫🇷',
    popularity: 800
  },
  {
    name: 'German',
    code: 'de',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    popularity: 750
  },
  {
    name: 'Chinese (Simplified)',
    code: 'zh',
    nativeName: '中文',
    flag: '🇨🇳',
    popularity: 950
  },
  {
    name: 'Japanese',
    code: 'ja',
    nativeName: '日本語',
    flag: '🇯🇵',
    popularity: 700
  },
  {
    name: 'Korean',
    code: 'ko',
    nativeName: '한국어',
    flag: '🇰🇷',
    popularity: 650
  },
  {
    name: 'Russian',
    code: 'ru',
    nativeName: 'Русский',
    flag: '🇷🇺',
    popularity: 600
  },
  {
    name: 'Italian',
    code: 'it',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    popularity: 550
  },
  {
    name: 'Portuguese',
    code: 'pt',
    nativeName: 'Português',
    flag: '🇵🇹',
    popularity: 500
  },
  {
    name: 'Arabic',
    code: 'ar',
    nativeName: 'العربية',
    flag: '🇸🇦',
    popularity: 450
  },
  {
    name: 'Hindi',
    code: 'hi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    popularity: 400
  },
  {
    name: 'Dutch',
    code: 'nl',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    popularity: 350
  },
  {
    name: 'Greek',
    code: 'el',
    nativeName: 'Ελληνικά',
    flag: '🇬🇷',
    popularity: 300
  },
  {
    name: 'Turkish',
    code: 'tr',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    popularity: 250
  },
  {
    name: 'Vietnamese',
    code: 'vi',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    popularity: 200
  },
  {
    name: 'Polish',
    code: 'pl',
    nativeName: 'Polski',
    flag: '🇵🇱',
    popularity: 150
  },
  {
    name: 'Thai',
    code: 'th',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    popularity: 100
  },
  {
    name: 'Swedish',
    code: 'sv',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    popularity: 50
  },
  {
    name: 'Norwegian',
    code: 'no',
    nativeName: 'Norsk',
    flag: '🇳🇴',
    popularity: 25
  }
];

// Import all languages
const importData = async () => {
  try {
    // Clear existing data
    await Language.deleteMany();
    console.log('Data cleared...');

    // Insert languages
    await Language.insertMany(languages);
    console.log('Language data imported!');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

importData();
