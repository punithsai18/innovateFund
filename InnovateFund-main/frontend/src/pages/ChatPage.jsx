import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const ChatPage = () => {
  const { user } = useAuth()
  const { socket, joinChat, leaveChat, startTyping, stopTyping, isUserOnline } = useSocket()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef(null)
  
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatUser, setNewChatUser] = useState('')
  const [typingUsers, setTypingUsers] = useState(new Set())

  // Fetch chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery(
    'chats',
    api.chat.getChats
  )

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['messages', selectedChat?._id],
    () => api.chat.getMessages(selectedChat._id, { page: 1, limit: 50 }),
    { enabled: !!selectedChat }
  )

  // Search users for new chat
  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['searchUsers', newChatUser],
    () => api.users.searchUsers({ q: newChatUser, page: 1, limit: 10 }),
    { enabled: newChatUser.length > 2 }
  )

  const chats = chatsData?.data?.chats || []
  const messages = messagesData?.data?.messages || []
  const searchUsers = usersData?.data?.users || []

  // Send message mutation
  const sendMessageMutation = useMutation(
    (data) => api.chat.sendMessage(selectedChat._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', selectedChat._id])
        queryClient.invalidateQueries('chats')
        setMessage('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message')
      }
    }
  )

  // Create chat mutation
  const createChatMutation = useMutation(
    (participantId) => api.chat.createChat({ participantId }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('chats')
        setSelectedChat(response.data.chat)
        setShowNewChatModal(false)
        setNewChatUser('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create chat')
      }
    }
  )

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = ({ chatId, message: newMessage }) => {
      if (selectedChat?._id === chatId) {
        queryClient.invalidateQueries(['messages', chatId])
      }
      queryClient.invalidateQueries('chats')
    }

    const handleUserTyping = ({ userId, chatId }) => {
      if (selectedChat?._id === chatId) {
        setTypingUsers(prev => new Set(prev).add(userId))
      }
    }

    const handleUserStopTyping = ({ userId, chatId }) => {
      if (selectedChat?._id === chatId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stop_typing', handleUserStopTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stop_typing', handleUserStopTyping)
    }
  }, [socket, selectedChat, queryClient])

  // Join/leave chat rooms
  useEffect(() => {
    if (selectedChat) {
      joinChat(selectedChat._id)
      return () => leaveChat(selectedChat._id)
    }
  }, [selectedChat, joinChat, leaveChat])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  useEffect(() => {
    let typingTimer
    
    if (message && selectedChat) {
      startTyping(selectedChat._id)
      
      clearTimeout(typingTimer)
      typingTimer = setTimeout(() => {
        stopTyping(selectedChat._id)
      }, 1000)
    }

    return () => clearTimeout(typingTimer)
  }, [message, selectedChat, startTyping, stopTyping])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (message.trim() && selectedChat) {
      sendMessageMutation.mutate({ content: message.trim() })
    }
  }

  const handleCreateChat = (participantId) => {
    createChatMutation.mutate(participantId)
  }

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user._id)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString()
    }
  }

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat)
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <Button
              size="sm"
              onClick={() => setShowNewChatModal(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <Input
            placeholder="Search conversations..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredChats.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat)
                const isOnline = isUserOnline(otherParticipant?._id)
                
                return (
                  <button
                    key={chat._id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedChat?._id === chat._id ? 'bg-primary-50 border-r-2 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <img
                          src={otherParticipant?.profilePicture || `https://ui-avatars.com/api/?name=${otherParticipant?.name}&background=667eea&color=fff`}
                          alt={otherParticipant?.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherParticipant?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {chat.lastActivity && formatTime(chat.lastActivity)}
                          </p>
                        </div>
                        
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-500 text-center">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setShowNewChatModal(true)}
              >
                Start a conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={getOtherParticipant(selectedChat)?.profilePicture || `https://ui-avatars.com/api/?name=${getOtherParticipant(selectedChat)?.name}&background=667eea&color=fff`}
                      alt={getOtherParticipant(selectedChat)?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {isUserOnline(getOtherParticipant(selectedChat)?._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  <div className="ml-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getOtherParticipant(selectedChat)?.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {isUserOnline(getOtherParticipant(selectedChat)?._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((message, index) => {
                    const isOwn = message.sender._id === user._id
                    const showDate = index === 0 || 
                      formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt)

                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" type="button">
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border-0 bg-gray-100 focus:bg-white"
                  />
                </div>

                <Button variant="ghost" size="sm" type="button">
                  <Smile className="w-4 h-4" />
                </Button>

                <Button
                  type="submit"
                  disabled={!message.trim()}
                  loading={sendMessageMutation.isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a conversation from the sidebar to start messaging.
              </p>
              <Button onClick={() => setShowNewChatModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChatModal}
        onClose={() => {
          setShowNewChatModal(false)
          setNewChatUser('')
        }}
        title="Start New Conversation"
        size="md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            icon={<Search className="w-4 h-4" />}
            value={newChatUser}
            onChange={(e) => setNewChatUser(e.target.value)}
          />

          {usersLoading && newChatUser.length > 2 && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}

          {searchUsers.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchUsers
                .filter(searchUser => searchUser._id !== user._id)
                .map((searchUser) => (
                  <button
                    key={searchUser._id}
                    onClick={() => handleCreateChat(searchUser._id)}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    disabled={createChatMutation.isLoading}
                  >
                    <div className="flex items-center">
                      <img
                        src={searchUser.profilePicture || `https://ui-avatars.com/api/?name=${searchUser.name}&background=667eea&color=fff`}
                        alt={searchUser.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{searchUser.name}</p>
                        {searchUser.company && (
                          <p className="text-sm text-gray-600">{searchUser.company}</p>
                        )}
                        <p className="text-xs text-gray-500 capitalize">{searchUser.userType}</p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {newChatUser.length > 2 && !usersLoading && searchUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
            </div>
          )}

          {newChatUser.length <= 2 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Type at least 3 characters to search</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ChatPage