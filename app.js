const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require("express-session");
const ppulistRoutes = require("./routes/ppulistRoutes");



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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")))

const sessionOptions ={
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};
app.use(session(sessionOptions));

// API Working in site
app.get("/", (req, res) => {
    res.send("Hi i am ppu team");
});

// Use the ppulist routes
app.use("/ppulists", ppulistRoutes);




// app.get("/testPpulist", async(req, res) => { // new ppu document create
//     let samplePpulist = new Ppulist({
//         title: "PPU Univercity",
//         description: "PPU Patna"
//     });
//     await samplePpulist.save(); // save data ppulist
//     console.log("sample was saved");
//     res.send("successful testing");
// });



app.all('*', (req, res, next) => {
    next(new ExpressError(404, "PPU Page Not Found"));
});




app.use((err, req, res, next) => {
    let {statusCode= 500, message = "Somethink went wrong"} = err;
    res.status(statusCode).render("error.ejs", { message});
//    res.status(statusCode).send(message);
});

app.get('/search', wrapAsync(async(req, res) => {
  const Ppulist = require('./models/ppulist');

  // Get the search query and clean it
  let input = req.query.q ? req.query.q.trim().replace(/\s+/g, " ") : "";

  if (input === "" || input === " ") {
    // If no flash middleware is set up, just redirect
    return res.redirect("/ppulists");
  }

  // Format the search term with proper capitalization
  let formattedInput = input.split(" ").map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");

  console.log('Searching for:', formattedInput);

  // Search by title
  let allPpulists = await Ppulist.find({
    title: { $regex: formattedInput, $options: "i" }
  }).sort({ time: -1 });

  if (allPpulists.length > 0) {
    console.log(`Found ${allPpulists.length} results by title`);
    return res.render("ppulists/index.ejs", {
      allPpulists,
      searchMessage: `Search results for "${input}" by title`,
      searchQuery: input
    });
  }

  // Search by description
  allPpulists = await Ppulist.find({
    description: { $regex: formattedInput, $options: "i" }
  }).sort({ time: -1 });

  if (allPpulists.length > 0) {
    console.log(`Found ${allPpulists.length} results by description`);
    return res.render("ppulists/index.ejs", {
      allPpulists,
      searchMessage: `Search results for "${input}" by description`,
      searchQuery: input
    });
  }

  // Search by postedBy
  allPpulists = await Ppulist.find({
    postedBy: { $regex: formattedInput, $options: "i" }
  }).sort({ time: -1 });

  if (allPpulists.length > 0) {
    console.log(`Found ${allPpulists.length} results by posted by`);
    return res.render("ppulists/index.ejs", {
      allPpulists,
      searchMessage: `Search results for "${input}" by posted by`,
      searchQuery: input
    });
  }

  // If no results found
  console.log('No results found');
  return res.render("ppulists/index.ejs", {
    allPpulists: [],
    searchMessage: `No results found for "${input}"`,
    searchQuery: input
  });
}))




app.listen(8081, () => {
    console.log("ppu team is working is project on port 8081");
});