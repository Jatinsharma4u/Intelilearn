const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  fromUser: { type: String, required: true, ref: 'User' }, // Firebase UID
  toUser: { type: String, required: true, ref: 'User' }, // Firebase UID
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'blocked', 'removed', 'cancelled'], // ✅ ADDED MISSING STATUSES
    default: 'pending'
  },
  sentAt: { type: Date, default: Date.now },
  respondedAt: Date,
  message: String
});

friendRequestSchema.index({ fromUser: 1, toUser: 1 });
friendRequestSchema.index({ toUser: 1, status: 1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

const friendSchema = new mongoose.Schema({
  user1: { type: String, required: true, ref: 'User' }, // Firebase UID
  user2: { type: String, required: true, ref: 'User' }, // Firebase UID
  since: { type: Date, default: Date.now },
  lastInteraction: { type: Date, default: Date.now }
});

friendSchema.pre('save', function(next) {
  if (this.user1 > this.user2) {
    [this.user1, this.user2] = [this.user2, this.user1];
  }
  next();
});

friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);

module.exports = { FriendRequest, Friend };