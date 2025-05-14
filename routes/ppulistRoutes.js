const express = require('express');
const router = express.Router();
const ppulistController = require('../controllers/ppulistController');
const { authenticate } = require('../middleware/auth');
const wrapAsync = require('../utils/wrapAsync');

router.get('/', wrapAsync(ppulistController.getAllPpulists));
router.get('/newpost', authenticate, ppulistController.renderNewForm);
router.post('/', authenticate, wrapAsync(ppulistController.createPpulist));
router.get('/:id', wrapAsync(ppulistController.getPpulist));
router.get('/:id/editpost', authenticate, wrapAsync(ppulistController.renderEditForm));
router.put('/:id', authenticate, wrapAsync(ppulistController.updatePpulist));
router.delete('/:id', authenticate, wrapAsync(ppulistController.deletePpulist));

module.exports = router;