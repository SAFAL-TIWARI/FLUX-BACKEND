const express = require('express');
const technovisionAdminAuth = require('../middleware/technovisionAdminAuth');
const {
  getCompetitions,
  registerParticipant,
  trackApplication,
  verifyAdminKey,
  getRegistrations,
  getStats,
  updateRegistrationStatus,
  deleteRegistration,
  exportRegistrations,
} = require('../controllers/technovisionController');

const router = express.Router();

router.get('/competitions', getCompetitions);
router.post('/register', registerParticipant);
router.get('/track/:appId', trackApplication);
router.post('/admin/verify-key', verifyAdminKey);
router.get('/admin/registrations', technovisionAdminAuth, getRegistrations);
router.get('/admin/stats', technovisionAdminAuth, getStats);
router.get('/admin/export', technovisionAdminAuth, exportRegistrations);
router.patch('/admin/:id/status', technovisionAdminAuth, updateRegistrationStatus);
router.delete('/admin/:id', technovisionAdminAuth, deleteRegistration);

module.exports = router;