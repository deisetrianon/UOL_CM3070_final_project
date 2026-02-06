import mongoose from 'mongoose';

/**
 * StressLog Schema
 * Stores historical stress indicator data for visualization and analysis
 * Each log entry represents a snapshot of the user's stress state at a specific time
 */
const stressLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  stressScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  stressLevel: {
    type: String,
    enum: ['normal', 'moderate', 'high'],
    required: true
  },
  componentScores: {
    facialScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    keystrokeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  metadata: {
    zenModeActive: {
      type: Boolean,
      default: false
    },
    interventionTriggered: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  collection: 'stresslogs'
});

// Compound indexes for efficient queries
stressLogSchema.index({ userId: 1, timestamp: -1 }); // Fetching user's recent history
stressLogSchema.index({ userId: 1, timestamp: 1 }); // Date range queries
stressLogSchema.index({ timestamp: -1 }); // Cleanup operations

/**
 * Getting stress history for a user
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date for history range
 * @param {Date} endDate - End date for history range
 * @param {Number} limit - Maximum number of records to return
 * @returns {Promise<Array>} Array of stress log entries
 */
stressLogSchema.statics.getUserHistory = async function(userId, startDate = null, endDate = null, limit = 1000) {
  const query = { userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Getting aggregated statistics
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date for statistics range
 * @param {Date} endDate - End date for statistics range
 * @returns {Promise<Object>} Aggregated statistics
 */
stressLogSchema.statics.getUserStatistics = async function(userId, startDate = null, endDate = null) {
  const query = { userId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$stressScore' },
        maxScore: { $max: '$stressScore' },
        minScore: { $min: '$stressScore' },
        totalEntries: { $sum: 1 },
        highStressCount: {
          $sum: { $cond: [{ $eq: ['$stressLevel', 'high'] }, 1, 0] }
        },
        moderateStressCount: {
          $sum: { $cond: [{ $eq: ['$stressLevel', 'moderate'] }, 1, 0] }
        },
        normalStressCount: {
          $sum: { $cond: [{ $eq: ['$stressLevel', 'normal'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    averageScore: 0,
    maxScore: 0,
    minScore: 0,
    totalEntries: 0,
    highStressCount: 0,
    moderateStressCount: 0,
    normalStressCount: 0
  };
};

// Cleaning up old logs
stressLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result;
};

const StressLog = mongoose.model('StressLog', stressLogSchema);

export default StressLog;
