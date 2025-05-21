const express = require('express');
const router = express.Router();
const ppulistController = require('../controllers/ppulistController');
const { authenticate } = require('../middleware/auth');
const wrapAsync = require('../utils/wrapAsync');
const upload = require('../middleware/upload');

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