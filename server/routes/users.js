const express = require('express');
const {
  getUsers,
  getUser,
  updateLanguages,
  updateProfilePicture,
  getRecommendations,
  addConnection,
  removeConnection,
  getConnections
} = require('../controllers/users');

const router = express.Router();

const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const User = require('../models/User');

router.use(protect);

router
  .route('/')
  .get(
    advancedResults(User, [{
      path: 'nativeLanguages'
    }, {
      path: 'learningLanguages.language',
      model: 'Language'
    }]),
    getUsers
  );

router.route('/:id').get(getUser);
router.route('/languages').put(updateLanguages);
router.route('/profile-picture').put(updateProfilePicture);
router.route('/recommendations').get(getRecommendations);
router.route('/connections').get(getConnections);
router.route('/connections/:id').post(addConnection).delete(removeConnection);

module.exports = router;
