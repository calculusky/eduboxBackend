const express = require('express');
const router = express.Router();

const { checkPermission } = require('../middleware/auth');
const { dashboard } = require('../controllers/user');


router.get('/dashboard', checkPermission, dashboard);

module.exports = router;