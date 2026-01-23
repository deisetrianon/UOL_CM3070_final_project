import mongoose from 'mongoose';

/**
 * User Schema
 * Stores authenticated user data from Google OAuth
 * 
 * Emails are not stored for privacy reasons.
 * Only user profile information and auth tokens are persisted.
 */
const userSchema = new mongoose.Schema({
  // Google OAuth ID: unique identifier from Google
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  // User profile information from Google
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  picture: {
    type: String,
    trim: true
  },
  // OAuth tokens for Gmail API access
  tokens: {
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String
      // Refresh token may not always be provided by Google
    },
    tokenExpiry: {
      type: Date
    }
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      stressAlerts: {
        type: Boolean,
        default: true
      }
    },
    facialAnalysis: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: Number,
        default: 5, // minutes between analyses
        min: 1,
        max: 60
      }
    },
    zenMode: {
      autoEnabled: {
        type: Boolean,
        default: true
      }
    }
  },
  stressMetrics: {
    lastAnalysis: {
      type: Date
    },
    lastFatigueScore: {
      type: Number,
      min: 0,
      max: 100
    },
    weeklyAverages: [{
      weekStart: Date,
      averageFatigueScore: Number,
      analysisCount: Number
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Additional indexes for common queries. Email and googleId already have indexes via 'unique: true'
userSchema.index({ lastLoginAt: -1 });

/**
 * Method to find or create a user from Google OAuth data
 * @param {Object} googleProfile 
 * @param {string} accessToken 
 * @param {string} refreshToken 
 * @returns {Promise<User>}
 */
userSchema.statics.findOrCreateFromGoogle = async function(googleProfile, accessToken, refreshToken) {
  const { id, emails, displayName, name, photos } = googleProfile;
  
  const email = emails?.[0]?.value;
  const picture = photos?.[0]?.value;
  const firstName = name?.givenName;
  const lastName = name?.familyName;

  let user = await this.findOne({ googleId: id });

  if (user) {
    // Updating existing user with fresh tokens and profile data
    user.email = email || user.email;
    user.displayName = displayName || user.displayName;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.picture = picture || user.picture;
    user.tokens.accessToken = accessToken;
    user.lastLoginAt = new Date();
    
    if (refreshToken) {
      user.tokens.refreshToken = refreshToken;
    }
    
    user.tokens.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour
    
    await user.save();
    console.log(`[User] Updated existing user: ${email}`);
  } else {
    // Creating a new user
    user = await this.create({
      googleId: id,
      email,
      displayName,
      firstName,
      lastName,
      picture,
      tokens: {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600 * 1000)
      },
      lastLoginAt: new Date()
    });
    console.log(`[User] Created new user: ${email}`);
  }

  return user;
};

/**
 * Method to get user data safe for client
 * Excludes sensitive token information
 * @returns {Object}
 */
userSchema.methods.toClientJSON = function() {
  return {
    id: this._id,
    googleId: this.googleId,
    email: this.email,
    displayName: this.displayName,
    firstName: this.firstName,
    lastName: this.lastName,
    picture: this.picture,
    preferences: this.preferences,
    stressMetrics: {
      lastAnalysis: this.stressMetrics?.lastAnalysis,
      lastFatigueScore: this.stressMetrics?.lastFatigueScore
    },
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt
  };
};

/**
 * Method to get data needed for session/API calls
Includes tokens for Gmail API access
 * @returns {Object}
 */
userSchema.methods.toSessionJSON = function() {
  return {
    id: this._id.toString(),
    googleId: this.googleId,
    email: this.email,
    displayName: this.displayName,
    firstName: this.firstName,
    lastName: this.lastName,
    picture: this.picture,
    accessToken: this.tokens.accessToken,
    refreshToken: this.tokens.refreshToken,
    tokenExpiry: this.tokens.tokenExpiry
  };
};

/**
 * Method to update stress metrics after facial analysis
 * @param {number} fatigueScore 
 * @returns {Promise<User>}
 */
userSchema.methods.updateStressMetrics = async function(fatigueScore) {
  this.stressMetrics.lastAnalysis = new Date();
  this.stressMetrics.lastFatigueScore = fatigueScore;
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
