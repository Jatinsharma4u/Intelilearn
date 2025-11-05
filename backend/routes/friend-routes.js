const express = require('express');
const router = express.Router();
const { FriendRequest, Friend } = require('../models/Friend');
const User = require('../models/User');
const verifyToken = require('../middleware/auth-middleware');

// Helper function to populate user details
const populateUserDetails = async (friendRequest) => {
  try {
    const fromUser = await User.findOne({ userId: friendRequest.fromUser });
    const toUser = await User.findOne({ userId: friendRequest.toUser });
    
    return {
      ...friendRequest.toObject(),
      _id: friendRequest._id,
      fromUser: fromUser ? {
        userId: fromUser.userId,
        username: fromUser.username,
        fullName: fromUser.fullName,
        avatar: fromUser.avatar,
        progress: fromUser.progress,
        battle_stats: fromUser.battle_stats
      } : { userId: friendRequest.fromUser },
      toUser: toUser ? {
        userId: toUser.userId,
        username: toUser.username,
        fullName: toUser.fullName,
        avatar: toUser.avatar,
        progress: toUser.progress,
        battle_stats: toUser.battle_stats
      } : { userId: friendRequest.toUser }
    };
  } catch (error) {
    console.error('Populate error:', error);
    return friendRequest;
  }
};

// 🔵 Send friend request - COMPLETELY FIXED
router.post('/request/send', verifyToken, async (req, res) => {
  try {
    const { toUsername, message } = req.body;
    const fromUserId = req.user.uid;

    console.log('📤 Sending friend request:', { fromUserId, toUsername });

    if (!toUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Can't send to yourself
    const toUser = await User.findOne({ username: toUsername.toLowerCase() });
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (toUser.userId === fromUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // ✅ FIXED: Check for ACTIVE requests only (pending/accepted)
    const activeRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUser.userId },
        { fromUser: toUser.userId, toUser: fromUserId }
      ],
      status: { $in: ['pending', 'accepted'] } // ✅ ONLY check active statuses
    });

    if (activeRequest) {
      if (activeRequest.status === 'pending') {
        if (activeRequest.fromUser === fromUserId) {
          return res.status(400).json({ error: 'Friend request already sent' });
        } else {
          return res.status(400).json({ error: 'This user has already sent you a friend request' });
        }
      }
      if (activeRequest.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends with this user' });
      }
    }

    // ✅ FIXED: Check for any previous request (including cancelled/rejected)
    const anyPreviousRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUser.userId },
        { fromUser: toUser.userId, toUser: fromUserId }
      ]
    });

    // If previous request exists with cancelled/rejected status, UPDATE it
    if (anyPreviousRequest && ['rejected', 'cancelled', 'removed'].includes(anyPreviousRequest.status)) {
      console.log('🔄 Reusing previous request with new status');
      
      // ✅ IMPORTANT: Ensure the direction is correct (FROM current user TO target user)
      anyPreviousRequest.fromUser = fromUserId;
      anyPreviousRequest.toUser = toUser.userId;
      anyPreviousRequest.status = 'pending';
      anyPreviousRequest.message = message || '';
      anyPreviousRequest.sentAt = new Date();
      anyPreviousRequest.respondedAt = null;
      
      await anyPreviousRequest.save();
      
      const populatedRequest = await populateUserDetails(anyPreviousRequest);
      return res.status(200).json({
        message: 'Friend request sent successfully',
        request: populatedRequest
      });
    }

    // Create completely new request
    const friendRequest = new FriendRequest({
      fromUser: fromUserId,
      toUser: toUser.userId,
      message: message || '',
      sentAt: new Date(),
      status: 'pending'
    });

    await friendRequest.save();
    const populatedRequest = await populateUserDetails(friendRequest);

    console.log('✅ New friend request sent successfully');
    res.status(201).json({
      message: 'Friend request sent successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('❌ Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Get pending friend requests (received) - FIXED
router.get('/requests/pending', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    console.log('📥 Fetching pending requests for user:', userId);

    const pendingRequests = await FriendRequest.find({
      toUser: userId, // ✅ Only requests sent TO current user
      status: 'pending'
    }).sort({ sentAt: -1 });

    console.log('📥 Found pending requests:', pendingRequests.length);

    const populatedRequests = await Promise.all(
      pendingRequests.map(populateUserDetails)
    );

    res.json(populatedRequests);
  } catch (error) {
    console.error('❌ Get pending requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Get sent friend requests - FIXED
router.get('/requests/sent', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    console.log('📤 Fetching sent requests for user:', userId);

    const sentRequests = await FriendRequest.find({
      fromUser: userId, // ✅ Only requests sent BY current user
      status: 'pending'
    }).sort({ sentAt: -1 });

    console.log('📤 Found sent requests:', sentRequests.length);

    const populatedRequests = await Promise.all(
      sentRequests.map(populateUserDetails)
    );

    res.json(populatedRequests);
  } catch (error) {
    console.error('❌ Get sent requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Accept friend request - FIXED
router.post('/request/accept/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.uid;

    console.log('✅ Accepting request:', { requestId, userId });

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      toUser: userId, // ✅ Only receiver can accept
      status: 'pending'
    });

    if (!friendRequest) {
      console.log('❌ Request not found or not authorized:', requestId);
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { user1: friendRequest.fromUser, user2: friendRequest.toUser },
        { user1: friendRequest.toUser, user2: friendRequest.fromUser }
      ]
    });

    if (existingFriendship) {
      friendRequest.status = 'accepted';
      friendRequest.respondedAt = new Date();
      await friendRequest.save();
      
      const populatedRequest = await populateUserDetails(friendRequest);
      return res.json({ 
        message: 'Friend request accepted successfully',
        request: populatedRequest,
        friendship: existingFriendship
      });
    }

    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    // Create friend relationship
    const friendship = new Friend({
      user1: friendRequest.fromUser,
      user2: friendRequest.toUser,
      since: new Date(),
      lastInteraction: new Date()
    });

    await friendship.save();

    const populatedRequest = await populateUserDetails(friendRequest);

    res.json({ 
      message: 'Friend request accepted successfully',
      request: populatedRequest,
      friendship: friendship
    });
  } catch (error) {
    console.error('❌ Accept friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Reject friend request - FIXED
router.post('/request/reject/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.uid;

    console.log('❌ Rejecting request:', { requestId, userId });

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      toUser: userId, // ✅ Only receiver can reject
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    const populatedRequest = await populateUserDetails(friendRequest);

    res.json({ 
      message: 'Friend request rejected successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('❌ Reject friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Cancel sent request - FIXED
router.delete('/request/cancel/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.uid;

    console.log('❌ Cancelling request:', { requestId, userId });

    const friendRequest = await FriendRequest.findOneAndUpdate(
      {
        _id: requestId,
        fromUser: userId, // ✅ Only sender can cancel
        status: 'pending'
      },
      {
        $set: { 
          status: 'cancelled',
          respondedAt: new Date()
        }
      },
      { new: true }
    );

    if (!friendRequest) {
      console.log('❌ Request not found for cancellation:', requestId);
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // ✅ Return populated request for frontend
    const populatedRequest = await populateUserDetails(friendRequest);

    console.log('✅ Request cancelled successfully');
    res.json({ 
      message: 'Friend request cancelled successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('❌ Cancel friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 🔵 Get friends list
router.get('/list', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const friendships = await Friend.find({
      $or: [{ user1: userId }, { user2: userId }]
    }).sort({ lastInteraction: -1 });

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.user1 === userId ? friendship.user2 : friendship.user1;
        const friendUser = await User.findOne({ userId: friendId });
        
        if (!friendUser) {
          return null;
        }

        return {
          userId: friendUser.userId,
          username: friendUser.username,
          fullName: friendUser.fullName,
          avatar: friendUser.avatar,
          progress: friendUser.progress,
          battle_stats: friendUser.battle_stats,
          friendshipId: friendship._id,
          since: friendship.since,
          lastInteraction: friendship.lastInteraction
        };
      })
    );

    const validFriends = friends.filter(friend => friend !== null);
    res.json(validFriends);
  } catch (error) {
    console.error('❌ Get friends list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Remove friend
router.delete('/remove/:friendshipId', verifyToken, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user.uid;

    console.log('🗑️ Removing friendship:', { friendshipId, userId });

    const friendship = await Friend.findOne({
      _id: friendshipId,
      $or: [{ user1: userId }, { user2: userId }]
    });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    const friendId = friendship.user1 === userId ? friendship.user2 : friendship.user1;

    await Friend.findByIdAndDelete(friendshipId);

    await FriendRequest.updateMany(
      {
        $or: [
          { fromUser: userId, toUser: friendId },
          { fromUser: friendId, toUser: userId }
        ]
      },
      {
        $set: { 
          status: 'removed',
          respondedAt: new Date()
        }
      }
    );

    console.log('✅ Friend removed successfully');
    res.json({ 
      message: 'Friend removed successfully',
      friendId: friendId
    });
  } catch (error) {
    console.error('❌ Remove friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Search users for friends
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, excludeFriends = 'true', showRemoved = 'false' } = req.query;
    const userId = req.user.uid;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters long' });
    }

    let excludeUserIds = [userId];

    if (excludeFriends === 'true') {
      const friendships = await Friend.find({
        $or: [{ user1: userId }, { user2: userId }]
      });
      
      friendships.forEach(friendship => {
        const friendId = friendship.user1 === userId ? friendship.user2 : friendship.user1;
        excludeUserIds.push(friendId);
      });

      const pendingRequests = await FriendRequest.find({
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: 'pending'
      });
      
      pendingRequests.forEach(request => {
        if (request.fromUser !== userId) excludeUserIds.push(request.fromUser);
        if (request.toUser !== userId) excludeUserIds.push(request.toUser);
      });

      if (showRemoved === 'false') {
        const removedRequests = await FriendRequest.find({
          $or: [{ fromUser: userId }, { toUser: userId }],
          status: { $in: ['removed', 'rejected', 'cancelled'] }
        });
        
        removedRequests.forEach(request => {
          if (request.fromUser !== userId) excludeUserIds.push(request.fromUser);
          if (request.toUser !== userId) excludeUserIds.push(request.toUser);
        });
      }
    }

    excludeUserIds = [...new Set(excludeUserIds)];

    const users = await User.find({
      $and: [
        { 
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } }
          ]
        },
        { userId: { $nin: excludeUserIds } }
      ]
    })
    .select('userId username fullName avatar progress battle_stats')
    .limit(20);

    res.json(users);
  } catch (error) {
    console.error('❌ Friend search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔵 Check friendship status
router.get('/status/:username', verifyToken, async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.uid;

    const targetUser = await User.findOne({ username: username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friendship = await Friend.findOne({
      $or: [
        { user1: userId, user2: targetUser.userId },
        { user1: targetUser.userId, user2: userId }
      ]
    });

    if (friendship) {
      return res.json({ status: 'friends', friendship });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: userId, toUser: targetUser.userId },
        { fromUser: targetUser.userId, toUser: userId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.json({ 
          status: existingRequest.fromUser === userId ? 'request_sent' : 'request_received',
          request: existingRequest 
        });
      }
      if (existingRequest.status === 'accepted') {
        return res.json({ status: 'was_friends', request: existingRequest });
      }
      if (existingRequest.status === 'rejected') {
        return res.json({ status: 'was_rejected', request: existingRequest });
      }
      if (existingRequest.status === 'removed') {
        return res.json({ status: 'was_removed', request: existingRequest });
      }
      if (existingRequest.status === 'cancelled') {
        return res.json({ status: 'was_cancelled', request: existingRequest });
      }
    }

    res.json({ status: 'not_connected' });
  } catch (error) {
    console.error('❌ Check friendship status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;