const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  username: { 
    type: String,
    required: true, 
    unique: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+..+/, 'Please enter a valid email address']
  }
});

// Apply passport-local-mongoose plugin to the schema
userSchema.plugin(passportLocalMongoose);

// Export the model safely without redeclaring
module.exports = mongoose.models.User || mongoose.model('User', userSchema);