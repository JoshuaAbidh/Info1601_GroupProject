require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'https://furtography.onrender.com'
})); // Enable CORS for specific origin
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Serve static files from the Project_Folder
app.use(express.static(path.join(__dirname, 'Project_Folder')));

// Serve the index.html file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Project_Folder', 'index.html'));
});

// MongoDB Connection
const createDefaultAccount = async () => {
    try {
        const defaultUsername = 'bob';
        const defaultPassword = 'bobpass'; // Default password
        const defaultBio = 'This is the default account for Bob.';
        const defaultProfilePicture = 'https://raw.githubusercontent.com/identicons/identicons/master/default.png';

        // Check if the default account already exists
        const existingUser = await User.findOne({ username: defaultUsername });
        if (!existingUser) {
            console.log('Default account not found. Creating one...');
            
            // Hash the default password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultPassword, salt);

            // Create the default user
            const defaultUser = new User({
                username: defaultUsername,
                password: hashedPassword,
                bio: defaultBio,
                profilePicture: defaultProfilePicture
            });

            await defaultUser.save();
            console.log('Default account created successfully:', defaultUsername);
        } else {
            console.log('Default account already exists:', defaultUsername);
        }
    } catch (error) {
        console.error('Error creating default account:', error);
    }
};

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    createDefaultAccount(); // Create or update the default account
})
.catch(err => console.error('MongoDB Atlas connection error:', err));

mongoose.connection.on('connected', () => {
    console.log('MongoDB Atlas connection established successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB Atlas connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: 'https://raw.githubusercontent.com/identicons/identicons/master/default.png' },
    bio: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

// Post Schema
const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    profilePicture: { type: String, required: true },
    image: { type: String, required: true },
    caption: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    reactions: [
        {
            username: { type: String, required: true },
            type: { type: String, required: true }
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Registration attempt for username:', username);

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.error('Username already exists:', username);
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        console.log('User registered successfully:', username);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            console.error('User not found:', username);
            return res.status(400).json({ error: 'User not found' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.error('Invalid password for user:', username);
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create token
        const token = jwt.sign({ username: user.username }, 'your-secret-key');
        console.log('Login successful for user:', username);
        res.json({
            token,
            user: {
                username: user.username,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Create Post
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { image, caption } = req.body;
        console.log('Creating post for user:', req.user.username);
        
        const user = await User.findOne({ username: req.user.username });

        if (!user) {
            console.log('User not found during post creation');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User profile picture:', user.profilePicture);

        const post = new Post({
            username: user.username,
            profilePicture: user.profilePicture,
            image,
            caption
        });

        await post.save();
        console.log('Post created successfully with profile picture:', post.profilePicture);
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Error creating post' });
    }
});

// Get Posts
app.get('/api/posts', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching posts for user:', req.user.username);
        const posts = await Post.find().sort({ createdAt: -1 });
        console.log('Found posts:', posts.length);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Error fetching posts' });
    }
});

// Add Reaction
app.post('/api/posts/:postId/reactions', authenticateToken, async (req, res) => {
    try {
        const { type } = req.body;
        const postId = req.params.postId;

        console.log('Received reaction request:', {
            postId,
            type,
            user: req.user.username
        });

        // Validate the reaction type
        if (!type || typeof type !== 'string') {
            console.error('Invalid reaction type:', type);
            return res.status(400).json({ error: 'Invalid reaction type' });
        }

        // Validate postId
        if (!postId || !postId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('Invalid post ID:', postId);
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        // Find the post by ID
        const post = await Post.findById(postId);
        if (!post) {
            console.error('Post not found with ID:', postId);
            return res.status(404).json({ error: 'Post not found' });
        }

        console.log('Post found:', {
            id: post._id,
            reactions: post.reactions
        });

        // Check if the user has already reacted
        const existingReaction = post.reactions.find(
            r => r.username === req.user.username
        );

        if (existingReaction) {
            // Update the existing reaction
            console.log('Updating existing reaction for user:', req.user.username);
            existingReaction.type = type;
        } else {
            // Add a new reaction
            console.log('Adding new reaction for user:', req.user.username);
            post.reactions.push({
                username: req.user.username,
                type
            });
        }

        // Save the updated post
        const savedPost = await post.save();
        console.log('Reaction added successfully:', {
            postId: savedPost._id,
            reactions: savedPost.reactions
        });
        
        res.json({ 
            message: 'Reaction added successfully', 
            post: savedPost 
        });
    } catch (error) {
        console.error('Error adding reaction:', {
            error: error.message,
            stack: error.stack,
            postId: req.params.postId,
            user: req.user.username
        });
        res.status(500).json({ 
            error: 'Error adding reaction',
            details: error.message 
        });
    }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { profilePicture, bio } = req.body;
        console.log('Updating profile with:', { profilePicture, bio });
        console.log('Updating profile for user:', req.user.username);
        console.log('New profile picture:', profilePicture);
        console.log('New bio:', bio);
        
        const user = await User.findOne({ username: req.user.username });

        if (!user) {
            console.log('User not found during profile update');
            return res.status(404).json({ error: 'User not found' });
        }

        if (profilePicture && typeof profilePicture === 'string') {
            console.log('Updating profile picture from:', user.profilePicture, 'to:', profilePicture);
            user.profilePicture = profilePicture;
        } else if (profilePicture) {
            console.error('Invalid profile picture format:', profilePicture);
            return res.status(400).json({ error: 'Invalid profile picture format' });
        }
        if (bio) user.bio = bio;

        try {
            await user.save();
            console.log('Profile updated successfully');
            res.json(user);
        } catch (error) {
            console.error('Database save error:', error);
            res.status(500).json({ error: 'Error saving profile to database', details: error.message });
        }
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Error updating profile', details: error.message });
    }
});

// Delete Post
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            console.error('Post not found with ID:', req.params.postId);
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if the user owns the post
        if (post.username !== req.user.username) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Error deleting post' });
    }
});

// Get User's Posts
app.get('/api/users/posts', authenticateToken, async (req, res) => {
    try {
        const posts = await Post.find({ username: req.user.username }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: 'Error fetching user posts' });
    }
});

// Get User Info by Username
app.get('/api/users/:username', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password'); // Exclude password from the response

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's posts
        const userPosts = await Post.find({ username: user.username })
            .sort({ createdAt: -1 });

        res.json({
            user,
            posts: userPosts
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Error fetching user info' });
    }
});

// Get API Config
app.get('/api/config', (req, res) => {
    res.json({ apiUrl: process.env.API_URL });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Fallback for unknown routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'Project_Folder', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});