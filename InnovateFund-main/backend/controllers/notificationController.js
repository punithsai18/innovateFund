import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { firebaseAdmin } from '../config/firebase.js';
import { sendEmail } from '../utils/emailService.js';
import { io } from '../server.js';

export const sendNotification = async (notificationData) => {
  try {
    // Create notification in database
    const notification = new Notification(notificationData);
    await notification.save();

    // Populate sender info
    await notification.populate('sender', 'name profilePicture');

    // Get recipient info
    const recipient = await User.findById(notificationData.recipient);
    
    if (!recipient) {
      console.error('Recipient not found for notification');
      return;
    }

    // Send real-time notification via Socket.IO
    io.to(`user_${recipient._id}`).emit('new_notification', notification);

    // Send push notification via Firebase Cloud Messaging
    if (recipient.fcmToken && firebaseAdmin.messaging) {
      try {
        const message = {
          notification: {
            title: notificationData.title,
            body: notificationData.message
          },
          data: {
            type: notificationData.type,
            actionUrl: notificationData.actionUrl || '',
            notificationId: notification._id.toString()
          },
          token: recipient.fcmToken
        };

        await firebaseAdmin.messaging().send(message);
        console.log('Push notification sent successfully');
        
      } catch (fcmError) {
        console.error('FCM Error:', fcmError);
        
        // If token is invalid, remove it
        if (fcmError.code === 'messaging/invalid-registration-token' || 
            fcmError.code === 'messaging/registration-token-not-registered') {
          recipient.fcmToken = '';
          await recipient.save();
        }
      }
    }

    // Send email notification for important events
    const emailNotificationTypes = [
      'new_investment',
      'collaboration_request',
      'milestone_achieved',
      'funding_goal_reached'
    ];

    if (emailNotificationTypes.includes(notificationData.type)) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: notificationData.title,
          template: 'notification',
          data: {
            recipientName: recipient.name,
            title: notificationData.title,
            message: notificationData.message,
            actionUrl: notificationData.actionUrl,
            senderName: notification.sender?.name
          }
        });

      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return notification;

  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error('Mark notification read error:', error);
    throw error;
  }
};

export const getUnreadNotificationsCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    return count;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};