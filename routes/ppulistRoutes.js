const express = require('express');
const router = express.Router();
const ppulistController = require('../controllers/ppulistController');
const { authenticate } = require('../middleware/auth');
const wrapAsync = require('../utils/wrapAsync');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'ppulist-file-' + uniqueSuffix + ext);
    }
});

// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedFileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, .png, .gif and .pdf files are allowed!'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Routes without file upload
router.get('/', wrapAsync(ppulistController.getAllPpulists));
router.get('/newpost', authenticate, ppulistController.renderNewForm);
router.get('/:id', wrapAsync(ppulistController.getPpulist));
router.get('/:id/editpost', authenticate, wrapAsync(ppulistController.renderEditForm));
router.delete('/:id', authenticate, wrapAsync(ppulistController.deletePpulist));

// Routes with file upload - use multer middleware
router.post('/', authenticate, upload.single('ppulist[file]'), wrapAsync(ppulistController.createPpulist));
router.put('/:id', authenticate, upload.single('ppulist[file]'), wrapAsync(ppulistController.updatePpulist));

module.exports = router;