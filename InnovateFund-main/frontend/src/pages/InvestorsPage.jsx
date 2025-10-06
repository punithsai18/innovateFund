import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Star, 
  Building, 
  MapPin,
  DollarSign,
  Award,
  Filter,
  Search
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useQuery } from 'react-query'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const InvestorsPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [selectedSector, setSelectedSector] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const sectors = [
    'technology', 'healthcare', 'finance', 'education', 
    'environment', 'social', 'consumer', 'enterprise'
  ]

  // Fetch investor leaderboard
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(
    'investorLeaderboard',
    () => api.investors.getLeaderboard({ page: 1, limit: 50 }),
    { enabled: activeTab === 'leaderboard' }
  )

  // Fetch sector-specific ideas for investor rooms
  const { data: sectorData, isLoading: sectorLoading } = useQuery(
    ['sectorRoom', selectedSector],
    () => api.investors.getSectorRoom(selectedSector, { page: 1, limit: 12 }),
    { enabled: activeTab === 'rooms' && selectedSector && user?.userType === 'investor' }
  )

  const investors = leaderboardData?.data?.investors || []
  const sectorIdeas = sectorData?.data?.ideas || []

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const InvestorCard = ({ investor, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={investor.profilePicture || `https://ui-avatars.com/api/?name=${investor.name}&background=667eea&color=fff`}
              alt={investor.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            {rank <= 3 && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-500'
              }`}>
                {rank}
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{investor.name}</h3>
            {investor.company && (
              <p className="text-sm text-gray-600 flex items-center">
                <Building className="w-4 h-4 mr-1" />
                {investor.company}
              </p>
            )}
            {investor.location && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {investor.location}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center text-yellow-500 mb-1">
            <Star className="w-4 h-4 mr-1 fill-current" />
            <span className="font-semibold">{investor.reputationScore}</span>
          </div>
          <p className="text-xs text-gray-500">Reputation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <div className="text-lg font-bold text-primary-600">
            {investor.totalInvestments}
          </div>
          <div className="text-xs text-gray-600">Investments</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {investor.successfulInvestments}
          </div>
          <div className="text-xs text-gray-600">Successful</div>
        </div>
      </div>

      {investor.sectorsOfInterest && investor.sectorsOfInterest.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Sectors of Interest:</p>
          <div className="flex flex-wrap gap-1">
            {investor.sectorsOfInterest.slice(0, 3).map((sector, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                {sector}
              </span>
            ))}
            {investor.sectorsOfInterest.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                +{investor.sectorsOfInterest.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <Button variant="outline" className="w-full">
        View Profile
      </Button>
    </motion.div>
  )

  const SectorIdeaCard = ({ idea }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
          {idea.title}
        </h3>
        <div className="ml-3">
          <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
            {idea.stage}
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {idea.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img
            src={idea.creator?.profilePicture || `https://ui-avatars.com/api/?name=${idea.creator?.name}&background=667eea&color=fff`}
            alt={idea.creator?.name}
            className="w-8 h-8 rounded-full object-cover mr-2"
          />
          <span className="text-sm text-gray-600">{idea.creator?.name}</span>
        </div>
        <div className="flex items-center text-yellow-500">
          <Star className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{idea.impactScore}</span>
        </div>
      </div>

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
            className="bg-primary-600 h-2 rounded-full"
            style={{ width: `${Math.min(100, (idea.currentFunding / idea.fundingGoal) * 100)}%` }}
          />
        </div>
      </div>

      <Button className="w-full">
        View & Invest
      </Button>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4"
          >
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Investor Hub
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {user?.userType === 'investor' 
              ? 'Discover promising ideas in your sectors of interest and connect with fellow investors.'
              : 'Meet our top investors and see who\'s actively funding innovative ideas.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'leaderboard'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Award className="w-4 h-4 mr-2 inline" />
              Leaderboard
            </button>
            {user?.userType === 'investor' && (
              <button
                onClick={() => setActiveTab('rooms')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'rooms'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 mr-2 inline" />
                Sector Rooms
              </button>
            )}
          </div>
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
              <Input
                placeholder="Search investors..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {leaderboardLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : investors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investors
                  .filter(investor => 
                    !searchQuery || 
                    investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    investor.company?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((investor, index) => (
                    <InvestorCard 
                      key={investor._id} 
                      investor={investor} 
                      rank={index + 1}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No investors found
                </h3>
                <p className="text-gray-600">
                  Check back later as more investors join the platform.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sector Rooms Tab */}
        {activeTab === 'rooms' && user?.userType === 'investor' && (
          <div>
            {/* Sector Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Sector
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sectors.map(sector => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedSector === sector
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sector.charAt(0).toUpperCase() + sector.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sector Ideas */}
            {selectedSector && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedSector.charAt(0).toUpperCase() + selectedSector.slice(1)} Ideas
                  </h2>
                  <div className="text-sm text-gray-500">
                    {sectorIdeas.length} ideas available
                  </div>
                </div>

                {sectorLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : sectorIdeas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sectorIdeas.map((idea) => (
                      <SectorIdeaCard key={idea._id} idea={idea} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No ideas in this sector yet
                    </h3>
                    <p className="text-gray-600">
                      Check back later or explore other sectors.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!selectedSector && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Sector
                </h3>
                <p className="text-gray-600">
                  Choose a sector above to discover relevant investment opportunities.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Access Denied for Non-Investors */}
        {activeTab === 'rooms' && user?.userType !== 'investor' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Investor Access Required
            </h3>
            <p className="text-gray-600">
              Sector rooms are exclusive to registered investors.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvestorsPage