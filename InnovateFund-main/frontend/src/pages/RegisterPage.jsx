import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { 
  Mail, 
  Lock, 
  User, 
  Building, 
  Eye, 
  EyeOff, 
  Lightbulb,
  Zap,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedUserType, setSelectedUserType] = useState('')
  const { register: registerUser, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm()

  const watchedUserType = watch('userType', selectedUserType)

  const onSubmit = async (data) => {
    try {
      const result = await registerUser(data)
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError('root', { message: result.error })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const userTypeOptions = [
    {
      value: 'innovator',
      label: 'Innovator',
      description: 'I have ideas and want to find investors',
      icon: Zap,
      color: 'from-primary-500 to-primary-600'
    },
    {
      value: 'investor',
      label: 'Investor',
      description: 'I want to discover and invest in great ideas',
      icon: TrendingUp,
      color: 'from-secondary-500 to-secondary-600'
    }
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">
                   SparkFund
                </span>
              </Link>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create your account
              </h1>
              <p className="text-gray-600">
                Join our community of innovators and investors
              </p>
            </div>

            {/* User Type Selection */}
            {!watchedUserType && (
              <div className="space-y-4 mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How do you want to join?
                </label>
                
                {userTypeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedUserType(option.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition-colors text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 bg-gradient-to-r ${option.color} rounded-lg flex items-center justify-center mr-3`}>
                        <option.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-primary-600">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Registration Form */}
            {(watchedUserType || selectedUserType) && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <input
                  type="hidden"
                  {...register('userType', { value: selectedUserType })}
                />

                {errors.root && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {errors.root.message}
                  </div>
                )}

                <Input
                  label="Full name"
                  type="text"
                  icon={<User className="w-4 h-4" />}
                  placeholder="Enter your full name"
                  error={errors.name?.message}
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                />

                <Input
                  label="Email address"
                  type="email"
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />

                <Input
                  label="Company (optional)"
                  type="text"
                  icon={<Building className="w-4 h-4" />}
                  placeholder="Enter your company name"
                  error={errors.company?.message}
                  {...register('company')}
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="Create a password"
                  error={errors.password?.message}
                  iconPosition="right"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      {...register('terms', {
                        required: 'You must accept the terms and conditions'
                      })}
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                      I agree to the{' '}
                      <a href="#" className="text-primary-600 hover:text-primary-500">
                        Terms and Conditions
                      </a>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {showPassword ? (
                      <span className="flex items-center">
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        Show
                      </span>
                    )}
                  </button>
                </div>

                {errors.terms && (
                  <p className="text-sm text-red-600">{errors.terms.message}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  Create Account
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedUserType('')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Choose different account type
                  </button>
                </div>
              </motion.form>
            )}

            {/* Footer */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in to your account →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div 
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            backgroundImage: 'url("https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/80 to-secondary-600/80" />
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center text-white p-12">
          <div className="max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                {selectedUserType === 'investor' 
                  ? 'Discover the Next Big Thing'
                  : 'Turn Your Ideas Into Reality'
                }
              </h2>
              <p className="text-lg opacity-90 leading-relaxed">
                {selectedUserType === 'investor'
                  ? 'Connect with innovative entrepreneurs and invest in the future. Find the next unicorn before everyone else.'
                  : 'Get the funding and mentorship you need to build something amazing. Your breakthrough is waiting.'
                }
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage