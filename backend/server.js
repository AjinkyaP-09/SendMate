const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const Post = require('./models/Post');
const User = require('./models/User');
// Initialize the app
const app = express();
dotenv.config();

// Connect to the database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'pame',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true when using HTTPS
}));



// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from public folder
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');
const messageRoute = require('./routes/messages');

app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/messages', messageRoute);

// Serve the homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Serve the login page
app.get('/login', (req, res) => {
  res.render('login');
});



// Serve the dashboard page (needs authentication middleware in future)
app.get('/dashboard', async (req, res) => {
  try {
      // Check if the user is logged in
      if (!req.session.user) {
          return res.redirect('/login'); // Redirect to login if not logged in
      }

      // Fetch user-specific posts using the logged-in user's ID
      const posts = await Post.find({ userId: req.session.user.id });

      // Render the dashboard and pass both user and posts data
      res.render('dashboard', { user: req.session.user, posts });
  } catch (err) {
      console.error(err);
      res.redirect('/login');
  }
});

// Serve individual post page
app.get('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const mockPostData = { title: 'Post Title', description: 'Detailed description' };  // Replace with real data
  res.render('post', { post: mockPostData });
});


app.get('/register', (req, res) => {
    res.render('register');
  });
  
app.get('/dashboard', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        // Fetch user-specific posts
        const posts = await Post.find({ userId: req.session.user.id });
        res.render('dashboard', { user: req.session.user, posts });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

app.post('/register', async (req, res) => {
  try {
      const { username, email, password, role } = req.body;
      // Perform validation and database logic

      let user = await User.findOne({ email });
      if (user) {
          return res.render('register', { error: 'User already exists' });
      }

      const newUser = new User({ username, email, password, role });
      await newUser.save();
      res.redirect('/login');  // Redirect to login after successful registration
  } catch (err) {
      console.error(err);
      res.status(500).send("Error registering the user.");
  }
});


app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
