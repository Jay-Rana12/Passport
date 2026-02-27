const Document = require('../models/Document');

// @desc    Upload document
// @route   POST https://passport-ia5r.onrender.com/api/documents/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const { documentType } = req.body;

        const document = await Document.create({
            user: req.user.id,
            documentType: documentType || 'Other',
            fileName: req.file.originalname,
            fileUrl: req.file.path.replace(/\\/g, '/') // Ensure forward slashes for URLs
        });

        res.status(201).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get my documents
// @route   GET https://passport-ia5r.onrender.com/api/documents/my
// @access  Private
exports.getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
