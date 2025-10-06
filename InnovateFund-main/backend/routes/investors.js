import express from 'express';
import User from '../models/User.js';
import Idea from '../models/Idea.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get investor leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const investors = await User.find({ userType: 'investor' })
      .select('name profilePicture company totalInvestments successfulInvestments reputationScore sectorsOfInterest')
      .sort({ reputationScore: -1, totalInvestments: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await User.countDocuments({ userType: 'investor' });

    res.json({
      investors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sector-specific ideas for investor rooms
router.get('/rooms/:sector', requireRole(['investor']), async (req, res) => {
  try {
    const { sector } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const validSectors = ['technology', 'healthcare', 'finance', 'education', 'environment', 'social', 'consumer', 'enterprise'];
    
    if (!validSectors.includes(sector)) {
      return res.status(400).json({ message: 'Invalid sector' });
    }

    const ideas = await Idea.find({ 
      category: sector, 
      status: 'published' 
    })
      .populate('creator', 'name profilePicture company')
      .sort({ createdAt: -1, impactScore: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Idea.countDocuments({ category: sector, status: 'published' });

    res.json({
      sector,
      ideas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get sector room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Make investment
// Make investment
router.post('/invest/:ideaId', requireRole(['investor']), async (req, res) => {
  try {
    const { amount, terms } = req.body;
    const { ideaId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid investment amount is required' });
    }

    const idea = await Idea.findById(ideaId).populate('creator', 'name profilePicture company');
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const existingInvestment = idea.investments.find(inv =>
      inv.investor.toString() === req.user._id.toString()
    );

    if (existingInvestment) {
      return res.status(400).json({ message: 'You have already invested in this idea' });
    }

    // Add investment
    idea.investments.push({
      investor: req.user._id,
      amount,
      terms: terms || '',
      investedAt: new Date()
    });

    idea.currentFunding = (idea.currentFunding || 0) + amount;
    await idea.save();

    req.user.totalInvestments += 1;
    req.user.reputationScore = Math.min(100, req.user.reputationScore + 2);
    await req.user.save();

    // Send notification
    const { sendNotification } = await import('../controllers/notificationController.js');
    await sendNotification({
      recipient: idea.creator,
      sender: req.user._id,
      type: 'new_investment',
      title: 'New Investment Received!',
      message: `${req.user.name} invested $${amount.toLocaleString()} in your idea "${idea.title}"`,
      relatedItem: { itemType: 'idea', itemId: idea._id },
      actionUrl: `/ideas/${idea._id}`
    });

    // ✅ Return the updated idea so frontend can refresh the card
    const updatedIdea = await Idea.findById(ideaId)
      .populate('creator', 'name profilePicture company')
      .populate('investments.investor', 'name profilePicture company');

    res.json({
      message: 'Investment made successfully',
      idea: updatedIdea
    });

  } catch (error) {
    console.error('Make investment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get investment history for current investor
router.get('/my-investments', requireRole(['investor']), async (req, res) => {
  try {
    const ideas = await Idea.find({
      'investments.investor': req.user._id
    })
      .populate('creator', 'name profilePicture company')
      .select('title description category currentFunding fundingGoal status createdAt investments')
      .sort({ 'investments.investedAt': -1 });

    const investments = ideas.map(idea => {
      const investment = idea.investments.find(inv => 
        inv.investor.toString() === req.user._id.toString()
      );
      return {
        idea: {
          _id: idea._id,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          creator: idea.creator,
          currentFunding: idea.currentFunding,
          fundingGoal: idea.fundingGoal,
          status: idea.status,
          createdAt: idea.createdAt
        },
        investment
      };
    });

    res.json({ investments });

  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;