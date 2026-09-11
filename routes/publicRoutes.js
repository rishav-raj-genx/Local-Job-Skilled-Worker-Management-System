const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const customerController = require('../controllers/customerController');

// Home Landing Page
router.get('/', publicController.getHome);

// Public Worker Directory & Profile (can be viewed prior to login, booking redirects to login)
router.get('/workers', (req, res) => {
  if (req.user && req.user.role === 'customer') {
    return res.redirect('/customer/search');
  }
  // Allow public searching as guest
  customerController.searchWorkers(req, res);
});

router.get('/workers/:workerId', (req, res, next) => {
  customerController.getWorkerProfile(req, res, next);
});

module.exports = router;
