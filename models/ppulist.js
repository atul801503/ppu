const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ppulistSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    postedBy: { 
        type: String, 
        required: true  // Remove `required: true` if not mandatory
    },
    time: { 
        type: Date, 
        default: Date.now 
    },
    description: String,
    image: { url: String, filename: String },

});



const Ppulist = mongoose.model("Ppulist", ppulistSchema);
module.exports = Ppulist;
