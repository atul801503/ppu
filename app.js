const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const { ExpressError } = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require("express-session");
const ppulistRoutes = require("./routes/ppulistRoutes");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");



// Router //
const userRouter = require("./routes/user.js");



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

app.use(express.json());
app.use(session(sessionOptions));

app.use(passport.initialize());  // <-- Fix here
app.use(passport.session());  
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = res.flash("error");
  // res.locals.currUser = req.user;
  next();
});


// API Working in site
app.get("/", (req, res) => {
    res.send("Hi i am ppu team");
});


// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "atulkumar234123@gmail.com",
//     username: "atul123"
//   });

// let registerUser = await User.register(fakeUser, "801503");
// res.send(registerUser);
// });

// Use the ppulist routes
app.use("/ppulists", ppulistRoutes);
app.use("/",userRouter);


// API endpoint to get search suggestions
app.get('/api/search-suggestions', wrapAsync(async (req, res) => {
  const Ppulist = require('./models/ppulist');
  const query = req.query.q ? req.query.q.trim() : '';

  if (!query || query.length < 1) {
    return res.json([]);
  }

  try {
    // Find posts with titles that match the query
    const titleMatches = await Ppulist.find({
      title: { $regex: query, $options: 'i' }
    })
    .sort({ time: -1 })
    .limit(10)
    .select('title _id');

    // Format the results
    const suggestions = titleMatches.map(post => ({
      id: post._id.toString(),
      title: post.title
    }));

    // Add search modifiers if we have results
    if (suggestions.length > 0 && query.length > 2) {
      suggestions.push({
        id: 'modifier-title',
        title: `${query} in title`,
        isModifier: true
      });

      suggestions.push({
        id: 'modifier-description',
        title: `${query} in description`,
        isModifier: true
      });
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
}));




// app.get("/testPpulist", async(req, res) => { // new ppu document create
//     let samplePpulist = new Ppulist({
//         title: "PPU Univercity",
//         description: "PPU Patna"
//     });
//     await samplePpulist.save(); // save data ppulist
//     console.log("sample was saved");
//     res.send("successful testing");
// });



app.get('/search', wrapAsync(async(req, res) => {
  const Ppulist = require('./models/ppulist');

  // Get the search query and clean it
  let input = req.query.q ? req.query.q.trim().replace(/\s+/g, " ") : "";

  if (input === "" || input === " ") {
    // If no flash middleware is set up, just redirect
    return res.redirect("/ppulists");
  }

  console.log('Searching for:', input);

  try {
    let searchQuery = {};
    let searchType = "all fields";

    // Check for "in title" or "in description" modifiers
    if (input.toLowerCase().endsWith(" in title")) {
      // Search only in title
      const actualQuery = input.slice(0, -9).trim(); // Remove " in title"
      searchQuery = { title: { $regex: actualQuery, $options: "i" } };
      searchType = "title";
      input = actualQuery; // Update input for display purposes
    } else if (input.toLowerCase().endsWith(" in description")) {
      // Search only in description
      const actualQuery = input.slice(0, -15).trim(); // Remove " in description"
      searchQuery = { description: { $regex: actualQuery, $options: "i" } };
      searchType = "description";
      input = actualQuery; // Update input for display purposes
    } else {
      // Search across all fields
      searchQuery = {
        $or: [
          { title: { $regex: input, $options: "i" } },
          { description: { $regex: input, $options: "i" } },
          { postedBy: { $regex: input, $options: "i" } }
        ]
      };
    }

    // Execute the search
    let allPpulists = await Ppulist.find(searchQuery).sort({ time: -1 });

    console.log(`Found ${allPpulists.length} results for "${input}" in ${searchType}`);

    // Get some search suggestions based on existing data
    let suggestions = [];
    if (allPpulists.length === 0) {
      // Add search modifiers as suggestions
      if (searchType === "all fields") {
        suggestions.push(`${input} in title`);
        suggestions.push(`${input} in description`);
      }

      // If no exact matches, find partial matches for suggestions
      const titleSuggestions = await Ppulist.find({
        title: { $regex: `.*${input}.*`, $options: "i" }
      }).limit(3).select('title');

      const descSuggestions = await Ppulist.find({
        description: { $regex: `.*${input}.*`, $options: "i" }
      }).limit(3).select('description');

      // Extract unique suggestions
      titleSuggestions.forEach(item => {
        if (!suggestions.includes(item.title)) {
          suggestions.push(item.title);
        }
      });

      descSuggestions.forEach(item => {
        // Extract a relevant snippet from description
        const desc = item.description;
        const index = desc.toLowerCase().indexOf(input.toLowerCase());
        if (index >= 0) {
          const start = Math.max(0, index - 15);
          const end = Math.min(desc.length, index + input.length + 15);
          const snippet = desc.substring(start, end);
          if (!suggestions.includes(snippet)) {
            suggestions.push(snippet);
          }
        }
      });

      suggestions = suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    // Prepare search message
    let searchMessage = "";
    if (allPpulists.length > 0) {
      searchMessage = `Found ${allPpulists.length} results for "${input}"`;
      if (searchType !== "all fields") {
        searchMessage += ` in ${searchType}`;
      }
    } else {
      searchMessage = `No results found for "${input}"`;
      if (searchType !== "all fields") {
        searchMessage += ` in ${searchType}`;
      }
    }

    // Render the results
    return res.render("ppulists/index.ejs", {
      allPpulists,
      searchMessage,
      searchQuery: input,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.render("ppulists/index.ejs", {
      allPpulists: [],
      searchMessage: `Error searching for "${input}". Please try again.`,
      searchQuery: input
    });
  }
}))

// Catch-all route for undefined routes - must be after all other routes
app.all('*', (req, res, next) => {
    next(new ExpressError(404, "PPU Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
    let {statusCode= 500, message = "Something went wrong"} = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.listen(8081, () => {
    console.log("ppu team is working is project on port 8081");
});