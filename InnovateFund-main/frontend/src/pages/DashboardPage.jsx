import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Lightbulb, 
  DollarSign,
  Plus,
  ArrowRight,
  Star,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useQuery } from 'react-query'

const DashboardPage = () => {
  const { user } = useAuth()

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    'userStats',
    api.users.getStats,
    { enabled: !!user }
  )

  // Fetch recent ideas
  const { data: ideasData, isLoading: ideasLoading } = useQuery(
    'recentIdeas',
    () => api.ideas.getIdeas({ page: 1, limit: 6, sortBy: 'createdAt' }),
    { enabled: !!user }
  )

  // Fetch investor leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(
    'investorLeaderboard',
    () => api.investors.getLeaderboard({ page: 1, limit: 5 }),
    { enabled: !!user }
  )

  const recentIdeas = ideasData?.data?.ideas || []
  const topInvestors = leaderboardData?.data?.investors || []

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              +{change}% from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )

  const IdeaCard = ({ idea }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {idea.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {idea.description}
          </p>
        </div>
        <div className="ml-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {idea.category}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(idea.currentFunding)} / {formatCurrency(idea.fundingGoal)}
          </div>
          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${Math.min(100, (idea.currentFunding / idea.fundingGoal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={idea.creator?.profilePicture || `https://ui-avatars.com/api/?name=${idea.creator?.name}&background=667eea&color=fff`}
            alt={idea.creator?.name}
            className="w-8 h-8 rounded-full object-cover mr-2"
          />
          <span className="text-sm text-gray-600">{idea.creator?.name}</span>
        </div>
        <Link to={`/ideas/${idea._id}`}>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </Link>
      </div>
    </motion.div>
  )

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.userType === 'innovator' 
              ? 'Ready to share your next big idea?' 
              : 'Discover the next breakthrough innovation.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user?.userType === 'innovator' ? (
            <>
              <StatCard
                title="Total Ideas"
                value={stats?.data?.stats?.totalIdeas || 0}
                icon={Lightbulb}
                color="bg-primary-500"
                change={12}
              />
              <StatCard
                title="Total Funding"
                value={formatCurrency(stats?.data?.stats?.totalFunding || 0)}
                icon={DollarSign}
                color="bg-green-500"
                change={8}
              />
              <StatCard
                title="Total Likes"
                value={stats?.data?.stats?.totalLikes || 0}
                icon={Heart}
                color="bg-red-500"
                change={15}
              />
              <StatCard
                title="Total Views"
                value={stats?.data?.stats?.totalViews || 0}
                icon={Eye}
                color="bg-blue-500"
                change={22}
              />
            </>
          ) : (
            <>
              <StatCard
                title="Total Investments"
                value={stats?.data?.stats?.totalInvestments || 0}
                icon={TrendingUp}
                color="bg-primary-500"
                change={5}
              />
              <StatCard
                title="Total Invested"
                value={formatCurrency(stats?.data?.stats?.totalInvested || 0)}
                icon={DollarSign}
                color="bg-green-500"
                change={12}
              />
              <StatCard
                title="Successful Investments"
                value={stats?.data?.stats?.successfulInvestments || 0}
                icon={Star}
                color="bg-yellow-500"
                change={8}
              />
              <StatCard
                title="Reputation Score"
                value={stats?.data?.stats?.reputationScore || 0}
                icon={Users}
                color="bg-purple-500"
                change={3}
              />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Ideas */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.userType === 'innovator' ? 'Your Recent Ideas' : 'Latest Ideas'}
              </h2>
              <Link to="/ideas">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {ideasLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : recentIdeas.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {recentIdeas.map((idea) => (
                  <IdeaCard key={idea._id} idea={idea} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {user?.userType === 'innovator' ? 'No ideas yet' : 'No ideas available'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {user?.userType === 'innovator' 
                    ? 'Start by submitting your first innovative idea.'
                    : 'Check back later for new innovative ideas.'}
                </p>
                {user?.userType === 'innovator' && (
                  <Link to="/ideas/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Idea
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {user?.userType === 'innovator' ? (
                  <>
                    <Link to="/ideas/create" className="block">
                      <Button className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Idea
                      </Button>
                    </Link>
                    <Link to="/chat" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Investors
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/ideas" className="block">
                      <Button className="w-full justify-start">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Browse Ideas
                      </Button>
                    </Link>
                    <Link to="/investors" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Investor Rooms
                      </Button>
                    </Link>
                  </>
                )}
                <Link to="/ai-assistant" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                </Link>
              </div>
            </div>

            {/* Top Investors */}
            {user?.userType === 'innovator' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Investors
                  </h3>
                  <Link to="/investors">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>

                {leaderboardLoading ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topInvestors.slice(0, 5).map((investor, index) => (
                      <div key={investor._id} className="flex items-center">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-medium mr-3">
                          {index + 1}
                        </div>
                        <img
                          src={investor.profilePicture || `https://ui-avatars.com/api/?name=${investor.name}&background=667eea&color=fff`}
                          alt={investor.name}
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {investor.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {investor.totalInvestments} investments
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            <span className="text-xs text-gray-600">
                              {investor.reputationScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage