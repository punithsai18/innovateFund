import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();

  const hasConnectedRef = useRef(false);

  useEffect(() => {
    if (!user || !token) {
      // ensure cleanup when user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setOnlineUsers(new Set());
      }
      hasConnectedRef.current = false;
      return;
    }

    if (hasConnectedRef.current) {
      return;
    }
    hasConnectedRef.current = true;

    const RAW_API_URL = import.meta.env.VITE_API_URL;
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      (RAW_API_URL
        ? RAW_API_URL.replace(/\/?api\/?$/, "")
        : typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5000");
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"], // force websocket to avoid long-poll race issues
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to server");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });

    // Notification handlers
    socketInstance.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast.success(notification.title, {
        duration: 5000,
        onClick: () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        },
      });
    });

    // Chat handlers
    socketInstance.on("new_message", ({ chatId, message }) => {
      console.log("New message received:", { chatId, message });
    });

    // User status handlers
    socketInstance.on("user_status_update", ({ userId, status }) => {
      if (status === "online") {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      } else {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    // Typing indicators
    socketInstance.on("user_typing", ({ userId, chatId }) => {
      console.log(`User ${userId} is typing in chat ${chatId}`);
    });
    socketInstance.on("user_stop_typing", ({ userId, chatId }) => {
      console.log(`User ${userId} stopped typing in chat ${chatId}`);
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Connection error occurred");
    });

    return () => {
      hasConnectedRef.current = false;
      socketInstance.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [user, token]);

  // Helper functions
  const joinChat = (chatId) => {
    if (socket) {
      socket.emit("join_chat", chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket) {
      socket.emit("leave_chat", chatId);
    }
  };

  const startTyping = (chatId) => {
    if (socket) {
      socket.emit("typing_start", { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socket) {
      socket.emit("typing_stop", { chatId });
    }
  };

  const updateStatus = (status) => {
    if (socket) {
      socket.emit("update_status", status);
    }
  };

  const markMessageDelivered = (messageId, senderId) => {
    if (socket) {
      socket.emit("message_delivered", { messageId, senderId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket,
    onlineUsers,
    notifications,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    updateStatus,
    markMessageDelivered,
    isUserOnline,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
};
