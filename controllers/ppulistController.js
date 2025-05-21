const Ppulist = require('../models/ppulist');
const { ExpressError } = require('../utils/ExpressError');
const fs = require('fs');
const path = require('path');

exports.getAllPpulists = async (req, res) => {
  const allPpulists = await Ppulist.find({});
  res.render('ppulists/index', { allPpulists });
};

exports.createPpulist = async (req, res) => {
  try {
    // Create new ppulist object from form data
    const ppulistData = { ...req.body.ppulist };

    // Handle file upload if present
    if (req.file) {
      // Create image object with url and filename
      ppulistData.image = {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
      };
    }

    // Create and save the new post
    const newPpulist = new Ppulist(ppulistData);
    await newPpulist.save();

    res.redirect('/ppulists');
  } catch (error) {
    console.error('Error creating post:', error);
    throw new ExpressError(500, 'Failed to create post');
  }
};

exports.getPpulist = async (req, res) => {
  const ppulist = await Ppulist.findById(req.params.id);
  if (!ppulist) throw new ExpressError(404, 'Ppulist not found');
  res.render('ppulists/show', { ppulist });
};

exports.updatePpulist = async (req, res) => {
  try {
    const { id } = req.params;
    const ppulistData = { ...req.body.ppulist };

    // Get the existing post to check for file removal
    const existingPpulist = await Ppulist.findById(id);
    if (!existingPpulist) {
      throw new ExpressError(404, 'Post not found');
    }

    // Handle file removal if checkbox is checked
    if (ppulistData.removeFile && existingPpulist.image) {
      // Delete the file from the filesystem if it exists
      const filePath = path.join(__dirname, '../public', existingPpulist.image.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Remove image data from the post
      ppulistData.image = undefined;
    } else if (req.file) {
      // If a new file is uploaded, update the image data
      ppulistData.image = {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
      };

      // Delete the old file if it exists
      if (existingPpulist.image && existingPpulist.image.url) {
        const oldFilePath = path.join(__dirname, '../public', existingPpulist.image.url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    } else {
      // If no new file and not removing, keep the existing image
      delete ppulistData.image;
    }

    // Remove the removeFile property as it's not part of the schema
    delete ppulistData.removeFile;

    // Update the post
    const updatedPpulist = await Ppulist.findByIdAndUpdate(
      id,
      ppulistData,
      { new: true, runValidators: true }
    );

    res.redirect(`/ppulists/${id}`);
  } catch (error) {
    console.error('Error updating post:', error);
    throw new ExpressError(500, 'Failed to update post');
  }
};

exports.deletePpulist = async (req, res) => {
  try {
    const { id } = req.params;
    const ppulist = await Ppulist.findById(id);

    if (!ppulist) {
      throw new ExpressError(404, 'Post not found');
    }

    // Delete the associated file if it exists
    if (ppulist.image && ppulist.image.url) {
      const filePath = path.join(__dirname, '../public', ppulist.image.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the post
    await Ppulist.findByIdAndDelete(id);

    res.redirect('/ppulists');
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new ExpressError(500, 'Failed to delete post');
  }
};

exports.renderNewForm = (req, res) => {
  res.render('ppulists/newpost');
};

exports.renderEditForm = async (req, res) => {
  const ppulist = await Ppulist.findById(req.params.id);
  if (!ppulist) throw new ExpressError(404, 'Ppulist not found');
  res.render('ppulists/editpost', { ppulist });
};