// State management
let currentUser = null;
let posts = [];
let token = null;

// API Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        token = savedToken;
        showMainPage();
    }

    // Add event listener for register link
    const registerLink = document.querySelector('a[href="#"]');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterPage();
        });
    }

    // Add event listener for login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// API Functions
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function register(username, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function createPost(imageData, caption) {
    try {
        console.log('Creating post with image and caption');
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                image: imageData,
                caption: caption
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create post');
        }

        const newPost = await response.json();
        console.log('Post created successfully:', newPost);
        return newPost;
    } catch (error) {
        console.error('Create post error:', error);
        throw error;
    }
}

async function fetchPosts() {
    try {
        console.log('Fetching posts with token:', token ? 'Token exists' : 'No token');
        const response = await fetch(`${API_URL}/posts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Fetch posts error response:', errorData);
            throw new Error(errorData.error || 'Failed to fetch posts');
        }

        const data = await response.json();
        console.log('Posts fetched successfully:', data.length, 'posts');
        return data;
    } catch (error) {
        console.error('Fetch posts error:', error);
        throw error;
    }
}

async function addReaction(postId, reaction) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/reactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type: reaction })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add reaction');
        }

        return data;
    } catch (error) {
        console.error('Add reaction error:', error);
        throw error;
    }
}

// Event Handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await login(username, password);
        currentUser = data.user;
        token = data.token;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('token', token);
        
        showMainPage();
    } catch (error) {
        alert(error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const data = await register(username, password);
        // After successful registration, we need to login to get the token
        const loginData = await login(username, password);
        
        currentUser = {
            username: username,
            profilePicture: 'https://i.imgur.com/6VBx3io.png',
            bio: ''
        };
        token = loginData.token;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('token', token);
        
        // Show profile setup page instead of login
        showProfileSetup();
    } catch (error) {
        alert(error.message);
    }
}

// UI Functions
function showLoginPage() {
    document.body.innerHTML = `
        <div class="auth-container">
            <h1>FurTography 🐾</h1>
            <form id="loginForm">
                <div class="form-group">
                    <input type="text" id="loginUsername" placeholder="Username" required>
                </div>
                <div class="form-group">
                    <input type="password" id="loginPassword" placeholder="Password" required>
                </div>
                <button type="submit" class="btn-primary">Login</button>
            </form>
            <p>Don't have an account? <a href="#" onclick="showRegisterPage()">Register</a></p>
        </div>
    `;
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function showRegisterPage() {
    document.body.innerHTML = `
        <div class="auth-container">
            <h1>FurTography 🐾</h1>
            <form id="registerForm">
                <div class="form-group">
                    <input type="text" id="registerUsername" placeholder="Username" required>
                </div>
                <div class="form-group">
                    <input type="password" id="registerPassword" placeholder="Password" required>
                </div>
                <button type="submit" class="btn-primary">Register</button>
            </form>
            <p>Already have an account? <a href="#" onclick="showLoginPage()">Login</a></p>
        </div>
    `;
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

async function showMainPage() {
    document.body.innerHTML = `
        <div class="main-content">
            <div id="posts-container"></div>
        </div>
        <nav class="nav-bar">
            <span class="nav-icon" onclick="showMainPage()">🏠</span>
            <span class="nav-icon" onclick="showCreatePost()">➕</span>
            <span class="nav-icon" onclick="showProfile()">👤</span>
            <span class="nav-icon" onclick="handleLogout()">🚪</span>
        </nav>
    `;
    await loadPosts();
}

function showCreatePost() {
    document.body.innerHTML = `
        <div class="main-content">
            <div class="create-post">
                <div class="upload-area" id="upload-area">
                    <p>Click to upload image</p>
                    <input type="file" id="post-image" accept="image/*" style="display: none">
                </div>
                <div class="create-post-sidebar">
                    <h2>Create New Post</h2>
                    <div class="form-group">
                        <textarea id="post-caption" placeholder="Write a caption..."></textarea>
                    </div>
                    <button type="button" class="btn-primary" id="post-button">Post</button>
                </div>
            </div>
        </div>
        <nav class="nav-bar">
            <span class="nav-icon" onclick="showMainPage()">🏠</span>
            <span class="nav-icon" onclick="showCreatePost()">➕</span>
            <span class="nav-icon" onclick="showProfile()">👤</span>
            <span class="nav-icon" onclick="handleLogout()">🚪</span>
        </nav>
    `;

    // Add image preview
    const imageInput = document.getElementById('post-image');
    const uploadArea = document.getElementById('upload-area');
    const postButton = document.getElementById('post-button');
    
    // Set up image upload
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });
    
    // Set up image preview
    imageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadArea.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 600px;">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Set up post button
    postButton.addEventListener('click', async () => {
        console.log('Post button clicked');
        
        const caption = document.getElementById('post-caption').value;
        
        if (!imageInput.files[0]) {
            alert('Please select an image');
            return;
        }

        try {
            // Create a canvas to compress the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = async () => {
                // Set maximum dimensions (1920x1080)
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed JPEG with higher quality (0.8)
                const compressedImage = canvas.toDataURL('image/jpeg', 0.8);

                try {
                    await createPost(compressedImage, caption);
                    alert('Post created successfully!');
                    showMainPage();
                } catch (error) {
                    alert(error.message || 'Failed to create post');
                }
            };

            img.src = URL.createObjectURL(imageInput.files[0]);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        }
    });
}

async function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;

    try {
        const posts = await fetchPosts();
        
        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="post">
                    <div class="post-header">
                        <p class="post-username">Welcome to FurTography! 🐾</p>
                    </div>
                    <p class="post-caption">Be the first to share your pet's moments! Click the + button to create a post.</p>
                </div>
            `;
            return;
        }

        const postsHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <img src="${post.profilePicture}" class="post-profile-pic" alt="${post.username}'s profile">
                    <span class="post-username" onclick="showUserProfile('${post.username}')" style="cursor: pointer;">${post.username}</span>
                </div>
                <img src="${post.image}" class="post-image" alt="Post image">
                <p class="post-caption">${post.caption}</p>
                <div class="post-actions">
                    <span class="action-button" onclick="handleReaction('${post._id}', '❤️')">❤️</span>
                    <span class="action-button" onclick="handleReaction('${post._id}', '🐾')">🐾</span>
                    <span class="action-button" onclick="handleReaction('${post._id}', '😊')">😊</span>
                </div>
            </div>
        `).join('');

        postsContainer.innerHTML = postsHTML;
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p>Error loading posts. Please try again.</p>';
    }
}

async function handleReaction(postId, reaction) {
    try {
        await addReaction(postId, reaction);
        await loadPosts(); // Reload posts to show updated reactions
    } catch (error) {
        alert(error.message);
    }
}

function handleLogout() {
    currentUser = null;
    token = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    showLoginPage();
}

// Add this new function to handle profile updates
async function updateUserProfile(profilePicture, bio) {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profilePicture, bio })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update profile');
        }

        const updatedUser = await response.json();
        return updatedUser;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

// Update the profile picture change event listener in showProfile function
function showProfile() {
    document.body.innerHTML = `
        <div class="main-content">
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-picture-container">
                        <img src="${currentUser.profilePicture}" class="profile-picture" id="profile-picture">
                        <input type="file" id="profile-image-input" accept="image/*" style="display: none">
                        <button class="btn-secondary" onclick="document.getElementById('profile-image-input').click()">Change Picture</button>
                    </div>
                    <div class="profile-info">
                        <h2>${currentUser.username}</h2>
                        <p class="profile-bio">${currentUser.bio || 'No bio yet'}</p>
                    </div>
                </div>
                <div class="profile-edit">
                    <h3>Edit Profile</h3>
                    <div class="form-group">
                        <input type="text" id="edit-username" placeholder="Username" value="${currentUser.username}">
                    </div>
                    <div class="form-group">
                        <textarea id="edit-bio" placeholder="Write a bio..." rows="4">${currentUser.bio || ''}</textarea>
                    </div>
                    <button class="btn-primary" onclick="saveProfile()">Save Changes</button>
                </div>
                <button class="btn-primary" onclick="showMyPosts()">My Posts</button>
                <button class="btn-primary" onclick="handleLogout()">Logout</button>
            </div>
        </div>
        <nav class="nav-bar">
            <span class="nav-icon" onclick="showMainPage()">🏠</span>
            <span class="nav-icon" onclick="showCreatePost()">➕</span>
            <span class="nav-icon" onclick="showProfile()">👤</span>
            <span class="nav-icon" onclick="handleLogout()">🚪</span>
        </nav>
    `;

    // Add profile picture change functionality
    const profileImageInput = document.getElementById('profile-image-input');
    const profilePicture = document.getElementById('profile-picture');

    profileImageInput.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const newProfilePicture = e.target.result;
                    profilePicture.src = newProfilePicture;
                    
                    const updatedUser = await updateUserProfile(newProfilePicture, currentUser.bio);
                    currentUser = updatedUser;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    await loadPosts();
                } catch (error) {
                    alert('Failed to update profile picture: ' + error.message);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

async function saveProfile() {
    const newUsername = document.getElementById('edit-username').value;
    const newBio = document.getElementById('edit-bio').value;

    if (!newUsername) {
        alert('Username cannot be empty');
        return;
    }

    try {
        // Update user profile in localStorage
        currentUser.username = newUsername;
        currentUser.bio = newBio;
        
        // Update the profile in the backend
        const updatedUser = await updateUserProfile(currentUser.profilePicture, newBio);
        
        // Update currentUser with the response from the server
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Update posts to reflect new username
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        posts.forEach(post => {
            if (post.username === currentUser.username) {
                post.username = newUsername;
                post.profilePicture = currentUser.profilePicture;
            }
        });
        localStorage.setItem('posts', JSON.stringify(posts));
        
        alert('Profile updated successfully!');
        showProfile(); // Refresh profile page
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile changes');
    }
}

function showProfileSetup() {
    document.body.innerHTML = `
        <div class="auth-container">
            <h1>Set Up Your Profile 🐾</h1>
            <div class="profile-setup">
                <div class="profile-picture-container">
                    <img src="${currentUser.profilePicture}" class="profile-picture" id="profile-picture">
                    <input type="file" id="profile-image-input" accept="image/*" style="display: none">
                    <button class="btn-secondary" onclick="document.getElementById('profile-image-input').click()">Add Profile Picture</button>
                </div>
                <div class="form-group">
                    <textarea id="profile-bio" placeholder="Write a short bio about yourself..." rows="4"></textarea>
                </div>
                <button class="btn-primary" onclick="completeProfileSetup()">Paws At The Ready! 🐾</button>
            </div>
        </div>
    `;

    // Add profile picture change functionality
    const profileImageInput = document.getElementById('profile-image-input');
    const profilePicture = document.getElementById('profile-picture');

    profileImageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePicture.src = e.target.result;
                currentUser.profilePicture = e.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

async function completeProfileSetup() {
    const bio = document.getElementById('profile-bio').value;
    try {
        console.log('Completing profile setup with picture:', currentUser.profilePicture);
        // Update the profile in the backend
        const updatedUser = await updateUserProfile(currentUser.profilePicture, bio);
        console.log('Profile updated with user data:', updatedUser);
        
        // Update currentUser with the response from the server
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        alert('Profile setup complete! Welcome to FurTography! 🐾');
        showMainPage();
    } catch (error) {
        console.error('Profile setup error:', error);
        alert('Failed to complete profile setup: ' + error.message);
    }
}

// Add these new API functions
async function fetchUserPosts() {
    try {
        const response = await fetch(`${API_URL}/users/posts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch user posts');
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch user posts error:', error);
        throw error;
    }
}

async function deletePost(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete post');
        }

        return await response.json();
    } catch (error) {
        console.error('Delete post error:', error);
        throw error;
    }
}

// Add the new showMyPosts function
async function showMyPosts() {
    document.body.innerHTML = `
        <div class="main-content">
            <div class="my-posts-container">
                <h2>My Posts</h2>
                <div id="my-posts-list"></div>
            </div>
        </div>
        <nav class="nav-bar">
            <span class="nav-icon" onclick="showMainPage()">🏠</span>
            <span class="nav-icon" onclick="showCreatePost()">➕</span>
            <span class="nav-icon" onclick="showProfile()">👤</span>
            <span class="nav-icon" onclick="handleLogout()">🚪</span>
        </nav>
    `;

    try {
        const posts = await fetchUserPosts();
        const postsContainer = document.getElementById('my-posts-list');

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>You haven\'t created any posts yet.</p>';
            return;
        }

        const postsHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <img src="${post.profilePicture}" class="post-profile-pic" alt="${post.username}'s profile">
                    <span class="post-username">${post.username}</span>
                    <button class="delete-post-btn" onclick="handleDeletePost('${post._id}')">🗑️</button>
                </div>
                <img src="${post.image}" class="post-image" alt="Post image">
                <p class="post-caption">${post.caption}</p>
                <div class="post-actions">
                    <span class="action-button" onclick="handleReaction('${post._id}', '❤️')">❤️</span>
                    <span class="action-button" onclick="handleReaction('${post._id}', '🐾')">🐾</span>
                    <span class="action-button" onclick="handleReaction('${post._id}', '😊')">😊</span>
                </div>
            </div>
        `).join('');

        postsContainer.innerHTML = postsHTML;
    } catch (error) {
        console.error('Error loading user posts:', error);
        document.getElementById('my-posts-list').innerHTML = '<p>Error loading your posts. Please try again.</p>';
    }
}

// Add the delete post handler
async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    try {
        await deletePost(postId);
        alert('Post deleted successfully!');
        await showMyPosts(); // Refresh the posts list
    } catch (error) {
        alert(error.message);
    }
}

// Add this new API function
async function fetchUserInfo(username) {
    try {
        const response = await fetch(`${API_URL}/users/${username}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch user info');
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch user info error:', error);
        throw error;
    }
}

// Add the new showUserProfile function
async function showUserProfile(username) {
    try {
        const { user, posts } = await fetchUserInfo(username);
        
        document.body.innerHTML = `
            <div class="main-content">
                <div class="user-profile-container">
                    <div class="user-profile-header">
                        <div class="profile-picture-container">
                            <img src="${user.profilePicture}" class="profile-picture">
                        </div>
                        <div class="profile-info">
                            <h2>${user.username}</h2>
                            <p class="profile-bio">${user.bio || 'No bio yet'}</p>
                        </div>
                    </div>
                    <div class="user-posts">
                        <h3>Posts</h3>
                        <div id="user-posts-list"></div>
                    </div>
                </div>
            </div>
            <nav class="nav-bar">
                <span class="nav-icon" onclick="showMainPage()">🏠</span>
                <span class="nav-icon" onclick="showCreatePost()">➕</span>
                <span class="nav-icon" onclick="showProfile()">👤</span>
                <span class="nav-icon" onclick="handleLogout()">🚪</span>
            </nav>
        `;

        // Scroll to top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        const postsContainer = document.getElementById('user-posts-list');
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts yet.</p>';
            return;
        }

        const postsHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <img src="${post.profilePicture}" class="post-profile-pic" alt="${post.username}'s profile">
                    <span class="post-username">${post.username}</span>
                </div>
                <img src="${post.image}" class="post-image" alt="Post image">
                <p class="post-caption">${post.caption}</p>
                <div class="post-actions">
                    <span class="action-button" onclick="handleReaction('${post._id}', '❤️')">❤️</span>
                    <span class="action-button" onclick="handleReaction('${post._id}', '🐾')">🐾</span>
                    <span class="action-button" onclick="handleReaction('${post._id}', '😊')">😊</span>
                </div>
            </div>
        `).join('');

        postsContainer.innerHTML = postsHTML;
    } catch (error) {
        console.error('Error loading user profile:', error);
        alert('Error loading user profile: ' + error.message);
    }
} 