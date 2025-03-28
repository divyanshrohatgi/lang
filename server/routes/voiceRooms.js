const express = require('express');
const {
  getVoiceRooms,
  getVoiceRoom,
  createVoiceRoom,
  updateVoiceRoom,
  deleteVoiceRoom,
  joinVoiceRoom,
  leaveVoiceRoom,
  toggleMute,
  toggleDeafen
} = require('../controllers/voiceRooms');

const router = express.Router();

const { protect } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const VoiceRoom = require('../models/VoiceRoom');

router.use(protect);

router
  .route('/')
  .get(
    advancedResults(
      VoiceRoom,
      [
        { path: 'host', select: 'username profilePicture' },
        { path: 'participants.user', select: 'username profilePicture' },
        { path: 'languages' }
      ]
    ),
    getVoiceRooms
  )
  .post(createVoiceRoom);

router
  .route('/:id')
  .get(getVoiceRoom)
  .put(updateVoiceRoom)
  .delete(deleteVoiceRoom);

router.route('/:id/join').post(joinVoiceRoom);
router.route('/:id/leave').post(leaveVoiceRoom);
router.route('/:id/toggle-mute').post(toggleMute);
router.route('/:id/toggle-deafen').post(toggleDeafen);

module.exports = router;
