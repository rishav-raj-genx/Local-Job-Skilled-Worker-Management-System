const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/role');

router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/register', redirectIfAuthenticated, authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;
