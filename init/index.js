const mongoose = require("mongoose");
const iniData = require("./data.js");
const Ppulist = require("../models/ppulist.js");

// Mongoose data base connect 

const MONGO_URL = "mongodb://127.0.0.1:27017/ppupatnagroup";

    main().then(() => { // MAIN FUNCTION CALL
        console.log("connect to DB")
    }) // MAIN FUNCTION CALL
    .catch((err) => { // any error
        console.log(err);
    })

async function main () {
  await mongoose.connect(MONGO_URL)  // MONGOOSE DATA PASS
}

const initDB = async () => {
    try {
        await Ppulist.deleteMany({});
        await Ppulist.insertMany(iniData.data); // ✅ Use iniData, not initData
        console.log("Data was initialized");
    } catch (err) {
        console.error("Error initializing data:", err);
    }
};



initDB();