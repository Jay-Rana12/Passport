const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const profileDir = path.join(__dirname, '../../uploads/profiles');
const signatureDir = path.join(__dirname, '../../uploads/signatures');
const documentDir = path.join(__dirname, '../../uploads/documents');

[profileDir, signatureDir, documentDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profilePhoto') {
            cb(null, 'uploads/profiles/');
        } else if (file.fieldname === 'digitalSignature') {
            cb(null, 'uploads/signatures/');
        } else {
            cb(null, 'uploads/documents/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File Filter (Images and PDFs)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, WEBP images and PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: fileFilter
});

module.exports = upload;

