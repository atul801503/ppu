const ppulist = require('../models/ppulist');
const { ExpressError } = require('../utils/ExpressError');

exports.getAllPpulists = async (req, res) => {
  const ppulists = await Ppulist.find({}).populate('author');
  res.render('ppulists/index', { ppulists });
};

exports.createPpulist = async (req, res) => {
  const ppulist = new Ppulist({
    ...req.body.ppulist,
    author: req.user._id
  });
  await ppulist.save();
  res.redirect('/ppulists');
};

exports.getPpulist = async (req, res) => {
  const ppulist = await Ppulist.findById(req.params.id).populate('author');
  if (!ppulist) throw new ExpressError(404, 'Ppulist not found');
  res.render('ppulists/show', { ppulist });
};

exports.updatePpulist = async (req, res) => {
  const { id } = req.params;
  const ppulist = await Ppulist.findByIdAndUpdate(id, { ...req.body.ppulist });
  res.redirect(`/ppulists/${id}`);
};

exports.deletePpulist = async (req, res) => {
  await Ppulist.findByIdAndDelete(req.params.id);
  res.redirect('/ppulists');
};

exports.renderNewForm = (req, res) => {
  res.render('ppulists/newpost');
};

exports.renderEditForm = async (req, res) => {
  const ppulist = await Ppulist.findById(req.params.id);
  if (!ppulist) throw new ExpressError(404, 'Ppulist not found');
  res.render('ppulists/editpost', { ppulist });
};