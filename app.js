const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Ppulist = require("./models/ppulist.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");



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
})
 // Index Route
app.get("/ppulists", wrapAsync(async (req, res) => {
   const  allPpulists = await Ppulist.find({});
   res.render("ppulists/index.ejs", {allPpulists})
        
}));

// New Post Route
app.get("/ppulists/newpost", (req, res) => {
    res.render("ppulists/newpost.ejs");
});
;


// Show Route
app.get("/ppulists/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const ppulist = await Ppulist.findById(id) // any data passing the show.ejs
    res.render("ppulists/show.ejs",{ppulist});
}));

// Create New Post Route

app.post("/ppulists", 
    wrapAsync(async(req, res, next) => {
        // Check if ppulist data exists
        if(!req.body.ppulist) {
            throw new ExpressError(400, "Send valid data for ppu");
        }

        // Validate required fields
        const requiredFields = ['title', 'description', 'postedBy', 'time'];
        const missingFields = requiredFields.filter(field => !req.body.ppulist[field]);
        
        if (missingFields.length > 0) {
            throw new ExpressError(400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        // Create and save new post
        const newPpulist = new Ppulist(req.body.ppulist);
        await newPpulist.save();
        
        res.redirect("/ppulists");
    })
);

// Edit Post Route
app.get("/ppulists/:id/editpost", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const ppulist = await Ppulist.findById(id);
    res.render("ppulists/editpost.ejs", { ppulist });
}));

// Update Route
app.put("/ppulists/:id", 
    wrapAsync(async (req, res) => {
        // 1. Validate incoming data structure
        if (!req.body.ppulist) {
            throw new ExpressError(400, "Invalid data format - expected { ppulist: {...} }");
        }

        // 2. Validate required fields
        const requiredFields = ['title', 'description', 'postedBy', 'time'];
        const missingFields = requiredFields.filter(field => !req.body.ppulist[field]);
        
        if (missingFields.length > 0) {
            throw new ExpressError(400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        // 3. Process the update
        const { id } = req.params;
        const updatedPpulist = await Ppulist.findByIdAndUpdate(
            id,
            { ...req.body.ppulist },
            { new: true, runValidators: true } // Return updated doc and run schema validators
        );

        if (!updatedPpulist) {
            throw new ExpressError(404, "Post not found");
        }

        // 4. Successful response
        res.redirect(`/ppulists/${id}`);
    })
);

// Delete Post Route
app.delete("/ppulists/:id", wrapAsync(async (req, res) => {
    try {
        let { id } = req.params;
        let deletePpulist = await Ppulist.findByIdAndDelete(id); // ✅ Corrected variable name

        if (!deletePpulist) {
            return res.status(404).send("Ppulist not found");
        }

        console.log("Deleted:", deletePpulist); // ✅ Correctly logging the deleted document
        res.redirect("/ppulists");
    } catch (error) {
        console.error("Error deleting Ppulist:", error);
        res.status(500).send("Server error");
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



app.all('*', (req, res, next) => {
    next(new ExpressError(404, "PPU Page Not Found"));
});




app.use((err, req, res, next) => {
    let {statusCode= 500, message = "Somethink went wrong"} = err;
    res.status(statusCode).render("error.ejs", { message});
//    res.status(statusCode).send(message);
});

app.get('/search', async(req, res)=>{
  let input = req.query.q.trim().replace(/\s+/g, " ");
  if (input == "" || input == " ") {
    req.flash("error", "Please enter search query!");
    res.redirect("/listings");
  }
  

  let data = input.split("");
  let element = "";
  let flag = false;
  for (let index = 0; index < data.length; index++) {
    if (index == 0 || flag) {
      element = element + data[index].toUpperCase();
    } else {
      element = element + data[index].toLowerCase();
    }
    flag = data[index] == " ";
  }

  let allListings = await Listing.find({
    title: { $regex: element, $options: "i" },
  });
  if (allListings.length != 0) {
    res.locals.success = "Listings searched by Title!";
    res.render("listings/index.ejs", { allListings });
    return;
  }

  if (allListings.length == 0) {
    allListings = await Listing.find({
      category: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Category!";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }
  if (allListings.length == 0) {
    allListings = await Listing.find({
      country: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Country!";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }

  if (allListings.length == 0) {
    allListings = await Listing.find({
      location: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListings.length != 0) {
      res.locals.success = "Listings searched by Location!";
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }

  const intValue = parseInt(element, 10);
  const intDec = Number.isInteger(intValue);

  if (allListings.length == 0 && intDec) {
    allListings = await Listing.find({ price: { $lte: element } }).sort({
      price: 1,
    });
    if (allListings.length != 0) {
      res.locals.success = `Listings searched by price less than Rs ${element}!`;
      res.render("listings/index.ejs", { allListings });
      return;
    }
  }
  if (allListings.length == 0) {
    req.flash("error", "No listings found based on your search!");
    res.redirect("/listings");
  }
})
  



app.listen(8080, () => {
    console.log("ppu team is working is project");
});