const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/role');

// All admin routes strictly require 'admin' role
router.use(requireRole('admin'));

// Master Dashboard & Aggregated Analytics
router.get('/dashboard', adminController.getDashboard);

// Worker Verification System
router.get('/workers', adminController.getWorkerVerification);
router.post('/workers/:workerId/verify', adminController.updateWorkerVerification);

// Platform User Management
router.get('/users', adminController.getUsers);
router.post('/users/:userId/toggle-status', adminController.toggleUserStatus);

// Complaint Monitoring System
router.get('/complaints', adminController.getComplaints);
router.get('/complaints/:complaintId', adminController.getComplaintDetail);
router.post('/complaints/:complaintId/status', adminController.updateComplaintStatus);

module.exports = router;
