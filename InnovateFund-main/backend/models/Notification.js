import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'new_investment',
      'idea_liked',
      'idea_commented',
      'collaboration_request',
      'collaboration_accepted',
      'message_received',
      'milestone_achieved',
      'funding_goal_reached'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 300
  },
  relatedItem: {
    itemType: {
      type: String,
      enum: ['idea', 'investment', 'chat', 'user']
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  actionUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better query performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);