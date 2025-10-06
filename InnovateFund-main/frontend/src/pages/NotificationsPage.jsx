import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  DollarSign,
  Heart,
  MessageSquare,
  Users,
  TrendingUp,
  Lightbulb
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const NotificationsPage = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all') // all, unread, read

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery(
    ['notifications', filter],
    () => api.notifications.getNotifications({ 
      page: 1, 
      limit: 50,
      unread: filter === 'unread' ? true : undefined 
    })
  )

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (id) => api.notifications.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark as read')
      }
    }
  )

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => api.notifications.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('All notifications marked as read')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark all as read')
      }
    }
  )

  // Delete notification mutation
  const deleteNotificationMutation = useMutation(
    (id) => api.notifications.deleteNotification(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications')
        toast.success('Notification deleted')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete notification')
      }
    }
  )

  const notifications = notificationsData?.data?.notifications || []
  const unreadCount = notificationsData?.data?.unreadCount || 0

  const getNotificationIcon = (type) => {
    const iconMap = {
      new_investment: DollarSign,
      idea_liked: Heart,
      idea_commented: MessageSquare,
      collaboration_request: Users,
      collaboration_accepted: Users,
      message_received: MessageSquare,
      milestone_achieved: TrendingUp,
      funding_goal_reached: Lightbulb
    }
    
    const Icon = iconMap[type] || Bell
    return <Icon className="w-5 h-5" />
  }

  const getNotificationColor = (type) => {
    const colorMap = {
      new_investment: 'text-green-600 bg-green-100',
      idea_liked: 'text-red-600 bg-red-100',
      idea_commented: 'text-blue-600 bg-blue-100',
      collaboration_request: 'text-purple-600 bg-purple-100',
      collaboration_accepted: 'text-green-600 bg-green-100',
      message_received: 'text-blue-600 bg-blue-100',
      milestone_achieved: 'text-yellow-600 bg-yellow-100',
      funding_goal_reached: 'text-green-600 bg-green-100'
    }
    
    return colorMap[type] || 'text-gray-600 bg-gray-100'
  }

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return notificationDate.toLocaleDateString()
  }

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id)
  }

  const handleDelete = (id) => {
    deleteNotificationMutation.mutate(id)
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Stay updated with your latest activities and interactions
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              loading={markAllAsReadMutation.isLoading}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all ${
                  !notification.read ? 'border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        {notification.sender && (
                          <div className="flex items-center mb-2">
                            <img
                              src={notification.sender.profilePicture || `https://ui-avatars.com/api/?name=${notification.sender.name}&background=667eea&color=fff&size=24`}
                              alt={notification.sender.name}
                              className="w-6 h-6 rounded-full object-cover mr-2"
                            />
                            <span className="text-xs text-gray-500">
                              from {notification.sender.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>

                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View Details →
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification._id)}
                            loading={markAsReadMutation.isLoading}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification._id)}
                          loading={deleteNotificationMutation.isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' 
                ? 'No unread notifications' 
                : filter === 'read'
                ? 'No read notifications'
                : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'You\'ll see notifications here when you have activity on your account.'
                : `Switch to "${filter === 'unread' ? 'all' : 'unread'}" to see ${filter === 'unread' ? 'all' : 'unread'} notifications.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage