const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");



const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");

const User = require("./models/user.js");
const ppulistRoutes = require("./routes/ppulistRoutes");
const userRouter = require("./routes/user.js");

// Database connection
const MONGO_URL = "mongodb://127.0.0.1:27017/ppupatnagroup";
main().then(() => console.log("Connected to DB"))
     .catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

// View engine & middleware setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Session config
const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};
app.use(session(sessionOptions));
app.use(flash());

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to pass flash messages and user info to templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  // console.log(success);
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes
app.use("/", userRouter);
app.use("/ppulists", ppulistRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hi I am PPU team");
});

// Mock database (in a real app, use a database like MongoDB/PostgreSQL)
const users = [
    {
        id: 1,
        username: 'user1',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrU2OFNHY6xX7eQ7aJ0q7T3QbQ1JQeW' // Hashed "old_password"
    }
];

// pp.use(bodyParser.json());
app.use(express.static('public')); // Serve HTML file

// Password change endpoint
app.post('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = users[0]; // For demo, assume user is logged in

    // 1. Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect." });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update password (in a real app, save to database)
    user.password = hashedPassword;

    res.json({ message: "Password updated successfully!" });
});

// Search Suggestions API
app.get("/api/search-suggestions", wrapAsync(async (req, res) => {
  const Ppulist = require("./models/ppulist");
  const query = req.query.q ? req.query.q.trim() : "";

  if (!query || query.length < 1) return res.json([]);

  const titleMatches = await Ppulist.find({
    title: { $regex: query, $options: "i" }
  }).sort({ time: -1 }).limit(10).select("title _id");

  const suggestions = titleMatches.map(post => ({
    id: post._id.toString(),
    title: post.title
  }));

  if (suggestions.length > 0 && query.length > 2) {
    suggestions.push({ id: "modifier-title", title: `${query} in title`, isModifier: true });
    suggestions.push({ id: "modifier-description", title: `${query} in description`, isModifier: true });
  }

  res.json(suggestions);
}));

// Search Route
app.get("/search", wrapAsync(async (req, res) => {
  const Ppulist = require("./models/ppulist");
  let input = req.query.q ? req.query.q.trim().replace(/\s+/g, " ") : "";

  if (!input || input === " ") return res.redirect("/ppulists");

  let searchQuery = {};
  let searchType = "all fields";

  if (input.toLowerCase().endsWith(" in title")) {
    input = input.slice(0, -9).trim();
    searchQuery = { title: { $regex: input, $options: "i" } };
    searchType = "title";
  } else if (input.toLowerCase().endsWith(" in description")) {
    input = input.slice(0, -15).trim();
    searchQuery = { description: { $regex: input, $options: "i" } };
    searchType = "description";
  } else {
    searchQuery = {
      $or: [
        { title: { $regex: input, $options: "i" } },
        { description: { $regex: input, $options: "i" } },
        { postedBy: { $regex: input, $options: "i" } }
      ]
    };
  }

  const allPpulists = await Ppulist.find(searchQuery).sort({ time: -1 });
  let suggestions = [];
  let searchMessage = "";

  if (allPpulists.length === 0) {
    if (searchType === "all fields") {
      suggestions.push(`${input} in title`, `${input} in description`);
    }

    const titleSuggestions = await Ppulist.find({
      title: { $regex: `.*${input}.*`, $options: "i" }
    }).limit(3).select("title");

    const descSuggestions = await Ppulist.find({
      description: { $regex: `.*${input}.*`, $options: "i" }
    }).limit(3).select("description");

    titleSuggestions.forEach(item => {
      if (!suggestions.includes(item.title)) suggestions.push(item.title);
    });

    descSuggestions.forEach(item => {
      const desc = item.description;
      const index = desc.toLowerCase().indexOf(input.toLowerCase());
      if (index >= 0) {
        const snippet = desc.substring(Math.max(0, index - 15), Math.min(desc.length, index + input.length + 15));
        if (!suggestions.includes(snippet)) suggestions.push(snippet);
      }
    });

    suggestions = suggestions.slice(0, 5);
    searchMessage = `No results found for "${input}"${searchType !== "all fields" ? ` in ${searchType}` : ""}`;
  } else {
    searchMessage = `Found ${allPpulists.length} results for "${input}"${searchType !== "all fields" ? ` in ${searchType}` : ""}`;
  }

  res.render("ppulists/index.ejs", {
    allPpulists,
    searchMessage,
    searchQuery: input,
    suggestions
  });
}));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.accountType !== 'admin') return res.sendStatus(403);
    
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.sendStatus(403);
  }
};

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        accountType: user.accountType
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Account Management Routes
app.route('/api/accounts')
  .get(authenticateAdmin, async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  })
  .post(authenticateAdmin, async (req, res) => {
    try {
      const { username, password, accountType } = req.body;

      const existingUser = await User.findOne({ username });
      if (existingUser) return res.status(400).json({ message: 'Username already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ username, password: hashedPassword, accountType });
      await newUser.save();

      res.status(201).json({ 
        message: 'Account created successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          accountType: newUser.accountType
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

// Delete account
app.delete('/api/accounts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete your own admin account' });

    const userToDelete = await User.findById(id);
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });

    if (userToDelete.accountType === 'admin') return res.status(403).json({ message: 'Cannot delete other admin accounts' });

    await User.findByIdAndDelete(id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin user detail
app.get('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// // Initialize admin account if none
async function initializeAdmin() {
  const adminExists = await User.findOne({ accountType: 'admin' });
  if (!adminExists) {
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',  // Add admin email here
      accountType: 'admin'
    });

    // Register with password hashing and save
    await User.register(admin, 'admin123');

    console.log('Default admin account created: username: admin, email: admin@example.com, password: admin123');
  }
}

// initializeAdmin();

// Error handling
app.all("*", (req, res, next) => next(new ExpressError(404, "PPU Page Not Found")));
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// Start server
app.listen(8081, () => {
  console.log("PPU team project running on port 8081");
});