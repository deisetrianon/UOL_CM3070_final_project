import express from 'express';
import StressLog from '../models/StressLog.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'Please log in to access stress history'
    });
  }
  next();
};

// Saving a new stress log entry
router.post('/', requireAuth, async (req, res) => {
  try {
    const { stressScore, stressLevel, componentScores, metadata } = req.body;

    // Validating required fields
    if (stressScore === undefined || stressScore === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'stressScore is required'
      });
    }

    if (!stressLevel || !['normal', 'moderate', 'high'].includes(stressLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stress level',
        message: 'stressLevel must be one of: normal, moderate, high'
      });
    }

    // Validating stress score range
    if (stressScore < 0 || stressScore > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stress score',
        message: 'stressScore must be between 0 and 100'
      });
    }

    const stressLog = new StressLog({
      userId: req.user.id,
      timestamp: new Date(),
      stressScore,
      stressLevel,
      componentScores: componentScores || {
        facialScore: 0,
        keystrokeScore: 0
      },
      metadata: metadata || {
        zenModeActive: false,
        interventionTriggered: false
      }
    });

    await stressLog.save();

    res.status(201).json({
      success: true,
      message: 'Stress log saved successfully',
      log: {
        id: stressLog._id,
        timestamp: stressLog.timestamp,
        stressScore: stressLog.stressScore,
        stressLevel: stressLog.stressLevel
      }
    });
  } catch (error) {
    console.error('[StressLogs] Error saving stress log:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to save stress log',
      message: error.message
    });
  }
});

/**
 * GET /api/stress-logs
 * Get stress history for the authenticated user
 * 
 * Query parameters:
 * - startDate: ISO date string (optional) - start of date range
 * - endDate: ISO date string (optional) - end of date range
 * - limit: number (optional, default: 1000) - maximum number of records
 * - days: number (optional) - number of days to look back (alternative to date range)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, limit, days } = req.query;

    let queryStartDate = null;
    let queryEndDate = null;
    const queryLimit = limit ? parseInt(limit, 10) : 1000;

    // Handling days parameter
    if (days) {
      const daysNum = parseInt(days, 10);
      if (daysNum > 0) {
        queryEndDate = new Date();
        queryStartDate = new Date();
        queryStartDate.setDate(queryStartDate.getDate() - daysNum);
      }
    } else {
      // Handling explicit date range
      if (startDate) {
        queryStartDate = new Date(startDate);
        if (isNaN(queryStartDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid startDate',
            message: 'startDate must be a valid ISO date string'
          });
        }
      }
      if (endDate) {
        queryEndDate = new Date(endDate);
        if (isNaN(queryEndDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid endDate',
            message: 'endDate must be a valid ISO date string'
          });
        }
      }
    }

    const history = await StressLog.getUserHistory(
      req.user.id,
      queryStartDate,
      queryEndDate,
      queryLimit
    );

    res.json({
      success: true,
      history: history.map(log => ({
        id: log._id,
        timestamp: log.timestamp,
        stressScore: log.stressScore,
        stressLevel: log.stressLevel,
        componentScores: log.componentScores,
        metadata: log.metadata
      })),
      count: history.length
    });
  } catch (error) {
    console.error('[StressLogs] Error fetching stress history:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stress history',
      message: error.message
    });
  }
});

/**
 * GET /api/stress-logs/statistics
 * Get aggregated statistics for the authenticated user
 * 
 * Query parameters:
 * - startDate: ISO date string (optional) - start of date range
 * - endDate: ISO date string (optional) - end of date range
 * - days: number (optional) - number of days to look back
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;

    let queryStartDate = null;
    let queryEndDate = null;

    if (days) {
      const daysNum = parseInt(days, 10);
      if (daysNum > 0) {
        queryEndDate = new Date();
        queryStartDate = new Date();
        queryStartDate.setDate(queryStartDate.getDate() - daysNum);
      }
    } else {
      if (startDate) {
        queryStartDate = new Date(startDate);
        if (isNaN(queryStartDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid startDate',
            message: 'startDate must be a valid ISO date string'
          });
        }
      }
      if (endDate) {
        queryEndDate = new Date(endDate);
        if (isNaN(queryEndDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid endDate',
            message: 'endDate must be a valid ISO date string'
          });
        }
      }
    }

    const statistics = await StressLog.getUserStatistics(
      req.user.id,
      queryStartDate,
      queryEndDate
    );

    const averageScore = statistics.averageScore != null ? statistics.averageScore : 0;
    const maxScore = statistics.maxScore != null ? statistics.maxScore : 0;
    const minScore = statistics.minScore != null ? statistics.minScore : 0;
    const totalEntries = statistics.totalEntries || 0;
    const highStressCount = statistics.highStressCount || 0;
    const moderateStressCount = statistics.moderateStressCount || 0;
    const normalStressCount = statistics.normalStressCount || 0;

    res.json({
      success: true,
      statistics: {
        averageScore: totalEntries > 0 ? Math.round(averageScore * 100) / 100 : 0,
        maxScore: maxScore,
        minScore: minScore,
        totalEntries: totalEntries,
        highStressCount: highStressCount,
        moderateStressCount: moderateStressCount,
        normalStressCount: normalStressCount,
        highStressPercentage: totalEntries > 0
          ? Math.round((highStressCount / totalEntries) * 100 * 100) / 100
          : 0,
        moderateStressPercentage: totalEntries > 0
          ? Math.round((moderateStressCount / totalEntries) * 100 * 100) / 100
          : 0,
        normalStressPercentage: totalEntries > 0
          ? Math.round((normalStressCount / totalEntries) * 100 * 100) / 100
          : 0
      }
    });
  } catch (error) {
    console.error('[StressLogs] Error fetching statistics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

export default router;
