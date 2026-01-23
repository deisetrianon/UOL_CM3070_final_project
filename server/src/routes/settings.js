import express from 'express';
import User from '../models/User.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }
  next();
};

/**
 * GET /api/settings
 * Get user preferences/settings
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      settings: {
        notifications: user.preferences?.notifications || {
          email: true,
          stressAlerts: true
        },
        facialAnalysis: user.preferences?.facialAnalysis || {
          enabled: false,
          frequency: 5
        },
        zenMode: user.preferences?.zenMode || {
          autoEnabled: true
        }
      }
    });
  } catch (error) {
    console.error('[Settings] Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

/**
 * PUT /api/settings
 * Update user preferences/settings
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    const { notifications, facialAnalysis, zenMode } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    // Updating notifications preferences
    if (notifications !== undefined) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    // Updating facial analysis preferences
    if (facialAnalysis !== undefined) {
      user.preferences.facialAnalysis = {
        ...user.preferences.facialAnalysis,
        ...facialAnalysis
      };
    }

    // Updating zen mode preferences
    if (zenMode !== undefined) {
      user.preferences.zenMode = {
        ...user.preferences.zenMode,
        ...zenMode
      };
    }

    await user.save();

    console.log(`[Settings] Updated preferences for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        notifications: user.preferences.notifications,
        facialAnalysis: user.preferences.facialAnalysis,
        zenMode: user.preferences.zenMode
      }
    });
  } catch (error) {
    console.error('[Settings] Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * PATCH /api/settings/zen-mode
 * Quick toggle for auto Zen Mode
 */
router.patch('/zen-mode', requireAuth, async (req, res) => {
  try {
    const { autoEnabled } = req.body;
    
    if (typeof autoEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'autoEnabled must be a boolean'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.zenMode) {
      user.preferences.zenMode = {};
    }

    user.preferences.zenMode.autoEnabled = autoEnabled;
    await user.save();

    console.log(`[Settings] Auto Zen Mode ${autoEnabled ? 'enabled' : 'disabled'} for user: ${user.email}`);

    res.json({
      success: true,
      message: `Auto Zen Mode ${autoEnabled ? 'enabled' : 'disabled'}`,
      autoEnabled
    });
  } catch (error) {
    console.error('[Settings] Error toggling auto Zen Mode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Zen Mode setting'
    });
  }
});

export default router;
