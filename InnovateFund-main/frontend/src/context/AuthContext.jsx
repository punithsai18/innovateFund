import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// Auth reducer for state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        loading: false
      }
    case 'ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: false,
  loading: true,
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        try {
          api.setAuthToken(token)
          const response = await api.auth.getCurrentUser()
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token
            }
          })
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('authToken')
          dispatch({ type: 'LOGOUT' })
        }
      } else {
        dispatch({ type: 'LOGOUT' })
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    dispatch({ type: 'LOADING' })

    try {
      const response = await api.auth.login({ email, password })
      const { user, token } = response.data

      localStorage.setItem('authToken', token)
      api.setAuthToken(token)

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      })

      toast.success(`Welcome back, ${user.name}!`)
      return { success: true }

    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      dispatch({ type: 'ERROR', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'LOADING' })

    try {
      const response = await api.auth.register(userData)
      const { user, token } = response.data

      localStorage.setItem('authToken', token)
      api.setAuthToken(token)

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      })

      toast.success(`Welcome to InnovateFund, ${user.name}!`)
      return { success: true }

    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      dispatch({ type: 'ERROR', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken')
    api.removeAuthToken()
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await api.users.updateProfile(userData)
      
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      })

      toast.success('Profile updated successfully')
      return { success: true }

    } catch (error) {
      const message = error.response?.data?.message || 'Update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}