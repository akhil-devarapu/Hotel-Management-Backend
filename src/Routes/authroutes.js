const express = require('express');
const router = express.Router();
const { registerStaff, loginStaff,registerGuest} = require('../cuntollers/authCuntroller');

router.post('/staff/register', registerStaff);
router.post('/staff/login', loginStaff);
router.post('/guest/register',registerGuest);

module.exports = router;