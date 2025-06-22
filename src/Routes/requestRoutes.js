const express = require('express');
const router = express.Router();
const requestController = require('../cuntollers/requestCuntroller');

router.post('/requests/create', requestController.createServiceRequest);
router.get('/requests', requestController.getAllRequests);
router.put('requests/:requestId/resolve', requestController.resolveRequest);
module.exports = router;
