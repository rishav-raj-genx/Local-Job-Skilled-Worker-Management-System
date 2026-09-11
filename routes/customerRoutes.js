const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireRole } = require('../middleware/role');

// All customer routes strictly require 'customer' role
router.use(requireRole('customer'));

// Dashboard
router.get('/dashboard', customerController.getDashboard);

// Search & Browse Workers
router.get('/search', customerController.searchWorkers);
router.get('/workers/:workerId', customerController.getWorkerProfile);

// Service Request Creation
router.get('/requests/new', customerController.getCreateRequest);
router.post('/requests/new', customerController.postCreateRequest);

// My Service Requests & Tracking
router.get('/requests', customerController.getMyRequests);
router.get('/requests/:requestId', customerController.getRequestDetails);
router.post('/requests/:requestId/cancel', customerController.cancelRequest);

// Stretch Goal: Job Rating
router.get('/requests/:requestId/rate', customerController.getRateJob);
router.post('/requests/:requestId/rate', customerController.postRateJob);

// Complaint Management
router.get('/requests/:requestId/complaint', customerController.getFileComplaint);
router.post('/requests/:requestId/complaint', customerController.postFileComplaint);

module.exports = router;
