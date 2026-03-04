import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
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
    tokens: {
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String
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
        default: 5,
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

userSchema.index({ lastLoginAt: -1 });

userSchema.statics.findOrCreateFromGoogle = async function(googleProfile, accessToken, refreshToken) {
  const { id, emails, displayName, name, photos } = googleProfile;
  
  const email = emails?.[0]?.value;
  const picture = photos?.[0]?.value;
  const firstName = name?.givenName;
  const lastName = name?.familyName;

  let user = await this.findOne({ googleId: id });

  if (user) {
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
    
    user.tokens.tokenExpiry = new Date(Date.now() + 3600 * 1000);
    
    await user.save();
    console.log(`[User] Updated existing user: ${email}`);
  } else {
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

userSchema.methods.updateStressMetrics = async function(fatigueScore) {
  this.stressMetrics.lastAnalysis = new Date();
  this.stressMetrics.lastFatigueScore = fatigueScore;
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
