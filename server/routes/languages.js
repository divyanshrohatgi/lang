const express = require('express');
const {
  getLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage
} = require('../controllers/languages');

const router = express.Router();

const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const Language = require('../models/Language');

router.use(protect);

router
  .route('/')
  .get(advancedResults(Language), getLanguages)
  .post(createLanguage);

router
  .route('/:id')
  .get(getLanguage)
  .put(updateLanguage)
  .delete(deleteLanguage);

module.exports = router;
