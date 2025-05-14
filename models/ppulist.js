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
    image: {
        filename: { type: String, default: "default-image" },
        url: { 
            type: String,
            default: "https://media.istockphoto.com/id/506670795/vector/red-apple.jpg?s=612x612&w=0&k=20&c=lF9vQ-kQPv3StsSFND4Okt1yqEO86q2XWFECgn0AqWU="
        }
    }
});



const Ppulist = mongoose.model("Ppulist", ppulistSchema);
module.exports = Ppulist;
