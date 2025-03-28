const express = require('express');
const {
  translateText,
  correctTranslation,
  getSupportedLanguages
} = require('../controllers/translations');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/translate').post(translateText);
router.route('/correct/:messageId').post(correctTranslation);
router.route('/languages').get(getSupportedLanguages);

module.exports = router;
