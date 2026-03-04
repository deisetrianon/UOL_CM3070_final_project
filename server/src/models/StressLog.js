import mongoose from 'mongoose';

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

stressLogSchema.index({ userId: 1, timestamp: -1 });
stressLogSchema.index({ userId: 1, timestamp: 1 });
stressLogSchema.index({ timestamp: -1 });

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
  
  const result = stats[0] || {
    averageScore: null,
    maxScore: null,
    minScore: null,
    totalEntries: 0,
    highStressCount: 0,
    moderateStressCount: 0,
    normalStressCount: 0
  };
  
  return {
    averageScore: result.averageScore != null ? result.averageScore : 0,
    maxScore: result.maxScore != null ? result.maxScore : 0,
    minScore: result.minScore != null ? result.minScore : 0,
    totalEntries: result.totalEntries || 0,
    highStressCount: result.highStressCount || 0,
    moderateStressCount: result.moderateStressCount || 0,
    normalStressCount: result.normalStressCount || 0
  };
};

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
