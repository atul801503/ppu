const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname.replace(/\[|\]/g, '-') + '-' + uniqueSuffix + ext);
    }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only .jpeg, .jpg, .png, .gif and .pdf files are allowed!'));
    }
};

// Helper function to parse nested form fields
const parseNestedFields = (req, _, next) => {
    // This middleware runs after multer but before our controller
    console.log('Parse nested fields middleware running');
    console.log('Request body:', req.body);

    if (req.body && req.body['ppulist[removeFile]']) {
        console.log('Found removeFile in request body');
        // If the removeFile checkbox is checked, set it in a more accessible format
        if (!req.body.ppulist) req.body.ppulist = {};
        req.body.ppulist.removeFile = true;
    }
    next();
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Export both the upload middleware and the parseNestedFields middleware
module.exports = {
    single: (fieldName) => [upload.single(fieldName), parseNestedFields]

};


