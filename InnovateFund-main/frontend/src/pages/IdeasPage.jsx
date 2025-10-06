import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Heart, 
  MessageSquare,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const IdeasPage = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [currentPage, setCurrentPage] = useState(1)

  const categories = [
    'technology', 'healthcare', 'finance', 'education', 
    'environment', 'social', 'consumer', 'enterprise'
  ]

  const stages = ['idea', 'prototype', 'mvp', 'beta', 'launched']

  const sortOptions = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'funding', label: 'Most Funded' },
    { value: 'impact', label: 'Highest Impact' }
  ]

  // Fetch ideas with filters
  const { data: ideasData, isLoading, refetch } = useQuery(
    ['ideas', searchQuery, selectedCategory, selectedStage, sortBy, currentPage],
    () => api.ideas.getIdeas({
      page: currentPage,
      limit: 12,
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      stage: selectedStage || undefined,
      sortBy
    }),
    { keepPreviousData: true }
  )

  const ideas = ideasData?.data?.ideas || []
  const pagination = ideasData?.data?.pagination || {}

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStageColor = (stage) => {
    const colors = {
      idea: 'bg-gray-100 text-gray-800',
      prototype: 'bg-blue-100 text-blue-800',
      mvp: 'bg-yellow-100 text-yellow-800',
      beta: 'bg-orange-100 text-orange-800',
      launched: 'bg-green-100 text-green-800'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const IdeaCard = ({ idea }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 relative">
        {idea.thumbnailUrl ? (
          <img
            src={idea.thumbnailUrl}
            alt={idea.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-primary-600 font-medium">{idea.category}</p>
            </div>
          </div>
        )}
        
        {/* Impact Score Badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
            <Star className="w-3 h-3 text-yellow-500 mr-1" />
            <span className="text-xs font-medium">{idea.impactScore}</span>
          </div>
        </div>

        {/* Stage Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(idea.stage)}`}>
            {idea.stage}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
            {idea.title}
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {idea.description}
        </p>

        {/* Funding Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(idea.currentFunding)}
            </span>
            <span className="text-sm text-gray-500">
              of {formatCurrency(idea.fundingGoal)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (idea.currentFunding / idea.fundingGoal) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((idea.currentFunding / idea.fundingGoal) * 100)}% funded
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {idea.views}
            </span>
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              {idea.likes?.length || 0}
            </span>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {idea.comments?.length || 0}
            </span>
          </div>
          <div className="flex items-center text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(idea.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={idea.creator?.profilePicture || `https://ui-avatars.com/api/?name=${idea.creator?.name}&background=667eea&color=fff`}
              alt={idea.creator?.name}
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{idea.creator?.name}</p>
              {idea.creator?.company && (
                <p className="text-xs text-gray-500">{idea.creator.company}</p>
              )}
            </div>
          </div>
          <Link to={`/ideas/${idea._id}`}>
            <Button size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Innovative Ideas
            </h1>
            <p className="text-gray-600 mt-2">
              Discover groundbreaking ideas and invest in the future
            </p>
          </div>
          
          {user?.userType === 'innovator' && (
            <div className="mt-4 sm:mt-0">
              <Link to="/ideas/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Idea
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search ideas..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Filter */}
            <div>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Stages</option>
                {stages.map(stage => (
                  <option key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-500">
              {pagination.totalItems || 0} ideas found
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : ideas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {ideas.map((idea) => (
                <IdeaCard key={idea._id} idea={idea} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No ideas found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('')
              setSelectedCategory('')
              setSelectedStage('')
              refetch()
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default IdeasPage