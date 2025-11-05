const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Utility function to generate unique username
const generateUniqueUsername = async (baseUsername) => {
  let username = baseUsername.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  let counter = 1;
  let finalUsername = username;

  while (await User.findOne({ username: finalUsername })) {
    finalUsername = `${username}${counter}`;
    counter++;
  }

  return finalUsername;
};

// Create user profile - POST /api/users/profile
router.post('/profile', async (req, res) => {
  try {
    const { userId, email, username, ...profileData } = req.body;
    
    // Check if profile already exists with userId
    const existingUserByUid = await User.findOne({ userId });
    if (existingUserByUid) {
      return res.status(400).json({ error: 'Profile already exists for this user' });
    }

    // Generate username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      finalUsername = await generateUniqueUsername(email.split('@')[0]);
    }

    // Check if username is available
    const existingUserByUsername = await User.findOne({ username: finalUsername.toLowerCase() });
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const user = new User({
      userId,
      email,
      username: finalUsername.toLowerCase(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Profile creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile by userId - GET /api/users/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile by username - GET /api/users/profile/username/:username
router.get('/profile/username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile - PUT /api/users/profile/:userId
router.put('/profile/:userId', async (req, res) => {
  try {
    const { username, ...updates } = req.body;

    // If username is being updated, check availability
    if (username) {
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(), 
        userId: { $ne: req.params.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updates.username = username.toLowerCase();
    }

    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check username availability - GET /api/users/check-username/:username
router.get('/check-username/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    
    // Basic validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.json({ 
        available: false, 
        message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
      });
    }

    const isAvailable = await User.isUsernameAvailable(username);
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users by username - GET /api/users/search?q=username
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    }).select('userId username fullName avatar progress battle_stats').limit(10);

    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;