import axios from "axios";

// Prefer relative '/api' so Vite dev proxy and Vercel rewrites both work without extra config.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API service object
export const api = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
    }
  },

  // Remove auth token
  removeAuthToken: () => {
    delete axiosInstance.defaults.headers.Authorization;
  },

  // Auth endpoints
  auth: {
    login: (data) => axiosInstance.post("/auth/login", data),
    register: (data) => axiosInstance.post("/auth/register", data),
    getCurrentUser: () => axiosInstance.get("/auth/me"),
  },

  // User endpoints
  users: {
    getProfile: (userId) => axiosInstance.get(`/users/profile/${userId || ""}`),
    updateProfile: (data) => axiosInstance.put("/users/profile", data),
    uploadProfilePicture: (file) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      return axiosInstance.post("/users/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    searchUsers: (params) => axiosInstance.get("/users/search", { params }),
    getStats: () => axiosInstance.get("/users/stats"),
  },

  // Ideas endpoints
  ideas: {
    getIdeas: (params) => axiosInstance.get("/ideas", { params }),
    getIdea: (id) => axiosInstance.get(`/ideas/${id}`),
    createIdea: (data) => axiosInstance.post("/ideas", data),
    uploadFiles: (ideaId, files) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      return axiosInstance.post(`/ideas/${ideaId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    editIdea: (id, data) => axiosInstance.put(`/ideas/${id}`, data),
    likeIdea: (id) => axiosInstance.post(`/ideas/${id}/like`),
    addComment: (id, data) => axiosInstance.post(`/ideas/${id}/comments`, data),
    requestCollaboration: (id) =>
      axiosInstance.post(`/ideas/${id}/collaborate`),
  },

  // Investor endpoints
  investors: {
    getLeaderboard: (params) =>
      axiosInstance.get("/investors/leaderboard", { params }),
    getSectorRoom: (sector, params) =>
      axiosInstance.get(`/investors/rooms/${sector}`, { params }),
    makeInvestment: (ideaId, data) =>
      axiosInstance.post(`/investors/invest/${ideaId}`, data),
    getMyInvestments: () => axiosInstance.get("/investors/my-investments"),
  },

  // Chat endpoints
  chat: {
    getChats: () => axiosInstance.get("/chat"),
    createChat: (data) => axiosInstance.post("/chat/create", data),
    getMessages: (chatId, params) =>
      axiosInstance.get(`/chat/${chatId}/messages`, { params }),
    sendMessage: (chatId, data) =>
      axiosInstance.post(`/chat/${chatId}/messages`, data),
    markAsRead: (chatId) => axiosInstance.post(`/chat/${chatId}/read`),
  },

  // Notification endpoints
  notifications: {
    getNotifications: (params) =>
      axiosInstance.get("/notifications", { params }),
    markAsRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
    markAllAsRead: () => axiosInstance.patch("/notifications/read-all"),
    deleteNotification: (id) => axiosInstance.delete(`/notifications/${id}`),
    updateFCMToken: (token) =>
      axiosInstance.post("/notifications/fcm-token", { token }),
  },

  // AI endpoints
  ai: {
    chat: (data) => axiosInstance.post("/ai/chat", data),
    getImpactScore: (data) => axiosInstance.post("/ai/impact-score", data),
  },
};

// Utility functions for handling API responses
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data.message || "An error occurred";
  } else if (error.request) {
    // Network error
    return "Network error. Please check your connection.";
  } else {
    // Other error
    return "An unexpected error occurred";
  }
};

export const createFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        data[key].forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  return formData;
};

export default api;
