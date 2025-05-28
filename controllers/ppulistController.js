const Ppulist = require('../models/ppulist');
const ExpressError = require('../utils/ExpressError');
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

    console.log('Update request body:', req.body);
    console.log('Parsed ppulist data:', ppulistData);
    console.log('File upload:', req.file);

    // Get the existing post to check for file removal
    const existingPpulist = await Ppulist.findById(id);
    if (!existingPpulist) {
      throw new ExpressError(404, 'Post not found');
    }

    // Check if the removeFile checkbox was checked
    const shouldRemoveFile = ppulistData.removeFile === 'on' || ppulistData.removeFile === true;
    console.log('Should remove file:', shouldRemoveFile);

    // IMPORTANT: If a new file is uploaded, it takes precedence over the removeFile checkbox
    if (req.file) {
      // If a new file is uploaded, update the image data
      console.log('New file uploaded:', req.file.filename);
      ppulistData.image = {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
      };

      // Delete the old file if it exists
      if (existingPpulist.image && existingPpulist.image.url) {
        const oldFilePath = path.join(__dirname, '../public', existingPpulist.image.url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Old file deleted');
        }
      }
    }
    // Only remove the file if no new file is uploaded AND the removeFile checkbox is checked
    else if (shouldRemoveFile && existingPpulist.image) {
      console.log('Removing existing file:', existingPpulist.image);
      // Delete the file from the filesystem if it exists
      if (existingPpulist.image.url) {
        const filePath = path.join(__dirname, '../public', existingPpulist.image.url);
        console.log('Attempting to delete file at:', filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('File deleted successfully');
        } else {
          console.log('File not found on disk');
        }
      }

      // Set image to null in the database
      ppulistData.image = null;
    } else {
      // If no new file and not removing, keep the existing image
      console.log('No file changes, keeping existing image');
      delete ppulistData.image;
    }

    // Remove the removeFile property as it's not part of the schema
    delete ppulistData.removeFile;

    console.log('Final update data:', ppulistData);

    // Update the post
    const updatedPpulist = await Ppulist.findByIdAndUpdate(
      id,
      ppulistData,
      { new: true, runValidators: true }
    );

    console.log('Post updated successfully:', updatedPpulist);
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