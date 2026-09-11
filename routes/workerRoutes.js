const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { requireRole } = require('../middleware/role');

// All worker routes strictly require 'worker' role
router.use(requireRole('worker'));

// Dashboard
router.get('/dashboard', workerController.getDashboard);

// Profile Management
router.get('/profile', workerController.getProfile);
router.post('/profile', workerController.postProfile);

// Skills Management
router.get('/skills', workerController.getSkills);
router.post('/skills', workerController.postSkills);

// Request Management & Status Transition
router.get('/requests', workerController.getRequests);
router.post('/requests/:requestId/status', workerController.updateRequestStatus);

module.exports = router;
