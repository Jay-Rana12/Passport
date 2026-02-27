const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getMyDocuments
} = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/upload', protect, upload.single('document'), uploadDocument);
router.get('/my', protect, getMyDocuments);

module.exports = router;
