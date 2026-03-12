# ZenFlow

**Emotion-Aware Adaptive Email and Task Manager to Reduce Workplace Stress**

ZenFlow is a comprehensive productivity application that combines email management, task tracking, and calendar integration with real-time stress monitoring and wellness interventions. The application uses facial analysis and keystroke pattern recognition to detect stress levels and automatically suggests interventions to help users maintain a healthy work-life balance.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features Explained](#key-features-explained)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Features

### Core Functionality
- **Email Management**: Full Gmail integration with inbox, starred, sent, drafts, and trash folders
- **Task Management**: Kanban-style task board with drag-and-drop functionality
- **Calendar Integration**: Google Calendar integration with event display and meeting reminders
- **Stress History**: Visual analytics and statistics for stress levels over time

### Wellness & Stress Management
- **Facial Analysis**: Real-time stress detection using Azure Face API
- **Keystroke Analysis**: Pattern recognition to detect stress from typing behavior
- **Stress Fusion**: Combines multiple data sources for accurate stress assessment 
- **Zen Mode**: Automatic focus mode that filters non-essential content during high stress
- **Wellness Interventions**: Guided exercises including:
  - Breathing exercises (4-7-8, Box Breathing)
  - Mindfulness meditation videos
  - Stretching guides
  - Anxiety relief techniques
  - Mental health resources

### Productivity Tools
- **Pomodoro Timer**: 
  - Built-in timer with work/break sessions (default: 25 min work, 5 min break)
  - Auto-expands when timer is active
  - State persistence across page refreshes
  - Session counting and progress tracking
  - Can trigger Zen Mode on completion
  - Visual progress indicators
- **Meeting Reminders**: 
  - Detects upcoming Google Meet video calls (within 10 minutes)
  - Shows contextual notifications with wellness exercise recommendations
  - Suggests breathing exercises or anxiety relief techniques before meetings
  - Dismissible notifications with smart tracking
  - **Smart Display Logic**: Only shows when Zen Mode is active OR when stress level is moderate/high (respects user notification preferences)
- **Burnout Information**: Educational resources about burnout prevention

### Settings & Preferences

- **Facial Analysis Settings**:
  - Enable/disable facial analysis
  - Adjust analysis frequency (1-10 minutes)
  - Camera permission management
- **Zen Mode Preferences**:
  - Toggle automatic Zen Mode activation
  - View current Zen Mode status and trigger reason
- **Notification Settings**:
  - **Meeting Reminders**: Toggle notifications for upcoming Google Meet meetings
  - **Stress Alerts**: Toggle alerts when high stress or fatigue is detected
  - **Zen Mode Integration**: All notifications are automatically suppressed when Zen Mode is active (except meeting reminders which show when Zen Mode is active or stress is moderate/high)
  - **Unified Notification System**: Centralized notification management that respects both user preferences and Zen Mode state
- **Settings Persistence**: All preferences are saved to the server and persist across sessions

### User Experience
- **Responsive Design**: Mobile and desktop optimized with adaptive layouts
- **Accessibility**: 
  - WCAG-compliant with full screen reader support
  - Keyboard navigation throughout the application
  - ARIA labels and live regions for dynamic content
  - Announcements for Zen Mode changes, stress level changes, and important state updates
  - Skip links for main content
  - Focus management in modals and dialogs
- **Real-time Updates**: Live stress monitoring and intervention suggestions
- **State Persistence**: Pomodoro timer state, user preferences, and session data persist across page refreshes

## Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **React Router DOM 6.26.0** - Client-side routing
- **Vite 5.4.0** - Build tool and dev server
- **@hello-pangea/dnd 18.0.1** - Drag and drop functionality
- **Moment.js 2.30.1** - Date manipulation and formatting
- **Recharts 3.7.0** - Data visualization
- **Canvas Confetti 1.9.4** - Celebration animations

### Backend
- **Node.js** - Runtime environment
- **Express 4.21.0** - Web framework
- **MongoDB with Mongoose 8.5.0** - Database and ODM
- **Passport.js 0.7.0** - Authentication middleware
- **Passport Google OAuth20 2.0.0** - Google authentication
- **Google APIs 170.1.0** - Gmail and Calendar integration
- **Axios 1.13.2** - HTTP client

### External Services
- **Google OAuth 2.0** - User authentication
- **Gmail API** - Email management
- **Google Calendar API** - Calendar integration
- **Azure Face API** - Facial analysis for stress detection

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (v6 or higher) - Local installation or MongoDB Atlas account
- **Google Cloud Platform Account** - For OAuth, Gmail, and Calendar APIs
- **Azure Account** - For Face API (optional, for facial analysis)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/deisetrianon/UOL_CM3070_final_project.git
   cd zenflow
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   
   This command installs dependencies for:
   - Root project
   - Client application
   - Server application

3. **Environment variables**
   
   The `.env` file is provided in the repository at `server/.env` with all required credentials already configured. No additional setup is needed.

4. **Start MongoDB**
   
   Ensure MongoDB is running locally, or update the MongoDB Atlas connection string in your `.env` file.

## Configuration

### Server Environment Variables

The `.env` file is provided in the repository at `server/.env` with all required credentials already configured and ready to use. The file includes:

```env
# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SESSION_SECRET=[configured]

# MongoDB Configuration
MONGODB_URI=[configured]

# Google OAuth Configuration
GOOGLE_CLIENT_ID=[configured]
GOOGLE_CLIENT_SECRET=[configured]
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Azure Face API Configuration (Optional)
AZURE_FACE_API_KEY=[configured]
AZURE_FACE_API_ENDPOINT=[configured]
```

**Note**: All credentials are pre-configured in the provided `.env` file. No additional setup is required.

### Service Configuration

All required services are already configured in the provided `.env` file:

- **Google OAuth**: Pre-configured with Client ID and Secret for Gmail and Calendar integration
- **MongoDB**: Connection string is configured
- **Azure Face API**: Pre-configured for facial analysis (optional feature)

**Note**: Facial analysis is optional. The application will work without it, but stress detection will rely solely on keystroke analysis. All credentials are ready to use as provided.

## Running the Application

### Development Mode

Run both client and server concurrently:

```bash
npm run dev
```

This starts:
- **Server**: `http://localhost:5001`
- **Client**: `http://localhost:5173`

### Run Separately

**Server only:**
```bash
npm run server
# or
cd server && npm run dev
```

**Client only:**
```bash
npm run client
# or
cd client && npm run dev
```

### Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Click "Sign in with Google" to authenticate
3. Grant necessary permissions for Gmail and Calendar access
4. Start using the application!

## Project Structure

```
zenflow/
├── client/                    # React Frontend application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── EmailList/     # Email list components
│   │   │   ├── Tasks/         # Task management components
│   │   │   ├── CustomCalendar/# Calendar components
│   │   │   ├── InterventionModal/ # Wellness intervention modals
│   │   │   └── ...
│   │   ├── contexts/          # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── StressFusionContext.jsx
│   │   │   ├── ZenModeContext.jsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useApi.js
│   │   │   ├── useEmailOperations.js
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── Home/          # Email management page
│   │   │   ├── Tasks/         # Task management page
│   │   │   ├── Calendar/      # Calendar page
│   │   │   └── ...
│   │   ├── utils/             # Utility functions
│   │   ├── constants/         # Application constants
│   │   └── assets/            # Static assets (icons, images)
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express Backend application
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   │   ├── index.js      # Environment config
│   │   │   └── passport.js   # Passport.js setup
│   │   ├── database/         # Database connection
│   │   ├── models/           # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   └── StressLog.js
│   │   ├── routes/           # API routes
│   │   │   ├── auth.js       # Authentication routes
│   │   │   ├── gmail.js      # Gmail API routes
│   │   │   ├── tasks.js      # Task management routes
│   │   │   ├── calendar.js   # Calendar routes
│   │   │   └── ...
│   │   ├── services/         # External service integrations
│   │   │   ├── gmailService.js
│   │   │   ├── calendarService.js
│   │   │   └── azureFaceService.js
│   │   ├── utils/            # Utility functions
│   │   ├── constants/        # Server constants
│   │   └── index.js          # Server entry point
│   ├── package.json
│   └── .env                  # Environment variables (create this)
│
├── package.json              # Root package.json
└── README.md                 # This file
```

## Key Features Explained

### Stress Detection System

The application uses a multi-modal approach to detect stress:

1. **Facial Analysis** (Optional)
   - Captures images via webcam at configurable intervals
   - Analyzes facial expressions using Azure Face API
   - Detects indicators of fatigue, stress, and emotional state

2. **Keystroke Analysis**
   - Monitors typing patterns and rhythm
   - Detects changes in typing speed and pressure
   - Identifies stress indicators from typing behavior

3. **Stress Fusion**
   - Combines data from multiple sources (facial analysis and keystroke patterns)
   - Calculates overall stress score (0-100) and stress level (low, moderate, high)
   - **Stress Level Thresholds**:
     - **Low**: Normal stress levels, no interventions triggered
     - **Moderate**: Triggers Zen Mode suggestions or auto-activation (if enabled)
     - **High**: Triggers immediate Zen Mode activation or urgent suggestions
   - Triggers interventions when thresholds are exceeded
   - Auto-deactivates Zen Mode when stress returns to normal levels

### Zen Mode

Zen Mode is an intelligent focus mode designed to reduce distractions during high stress:

- **Automatic Activation**: Automatically triggers when stress levels reach "moderate" or "high" thresholds (if enabled in settings)
- **Smart Suggestions**: When automatic mode is disabled, shows contextual suggestions like "We noticed signs of fatigue. Would you like to enable Zen Mode?" or "High stress detected. Would you like to focus on priority items?"
- **Suggestion Cooldown**: Prevents suggestion spam with a 10-minute cooldown between suggestions
- **Auto-Deactivation**: Automatically disables when stress levels return to normal (only if it was auto-triggered)
- **Content Filtering**: Hides non-essential emails and tasks when active
- **Focus Enhancement**: Shows only priority items (starred emails, urgent tasks, important calendar events)
- **Notification Suppression**: Automatically suppresses all notifications (alerts, browser notifications, confirmations) when active to minimize distractions
  - **Exception**: Meeting reminders still show when Zen Mode is active (to provide wellness support before meetings)
- **Manual Override**: Users can manually enable/disable Zen Mode at any time
- **Settings Control**: Users can toggle automatic Zen Mode activation in Settings
- **Status Indicators**: Visual and screen reader announcements indicate when Zen Mode is active, whether it was auto-triggered or manually enabled, and the reason for activation

### Wellness Interventions

When stress is detected, the application suggests various interventions:

- **Breathing Exercises**: Guided 4-7-8 and Box Breathing techniques
- **Mindfulness**: YouTube meditation videos of varying lengths
- **Stretching**: Desk-friendly stretching routines
- **Anxiety Relief**: Grounding techniques and relaxation exercises
- **Mental Health Resources**: Crisis hotlines and support information

### Email Management

- **Full Gmail Integration**: Access to all Gmail labels and folders (Inbox, Starred, Sent, Drafts, Trash, Spam)
- **Search Functionality**: Search emails by query with real-time results
- **Bulk Operations**: Mark as read, star/unstar, delete multiple emails at once
- **Email Viewing**: Full email content with attachments and formatted display
- **Reply/Reply All**: Quick email composition directly from email view
- **Pagination**: Navigate through large email lists with page tokens
- **Zen Mode Filtering**: When Zen Mode is active, shows only starred/important emails to reduce distractions
- **Email Statistics**: Displays count of hidden emails when Zen Mode is filtering content

### Task Management

- **Kanban Board**: Visual task organization (To Do, In Progress, Done) with drag-and-drop
- **Drag and Drop**: Reorder tasks within and between columns with smooth animations
- **Task Details**: Title, description, priority (low, medium, high), deadline, urgency flag
- **Pomodoro Integration**: Start Pomodoro timer directly from urgent tasks with one click
- **Task Statistics**: Overview of task completion, distribution by status, and completion rate
- **List View**: Alternative list view for tasks grouped by status
- **Zen Mode Filtering**: When Zen Mode is active, shows only urgent and high-priority tasks
- **Task Creation/Editing**: Modal interface for creating and editing tasks with validation

### Calendar Integration

- **Multiple Views**: Day, Week, and Month views with smooth navigation
- **Event Display**: Shows Google Calendar events and tasks in a unified view
- **Meeting Detection**: Automatically identifies Google Meet video calls
- **Meeting Reminders**: 
  - Shows notifications 10 minutes before Google Meet calls
  - Recommends wellness exercises (breathing or anxiety relief) based on context
  - Dismissible with smart tracking to avoid duplicate notifications
  - **Smart Display**: Shows when Zen Mode is active OR when stress level is moderate/high (respects notification settings)
  - Helps users prepare for meetings with wellness exercises when they need support most
- **Event Styling**: Color-coded events by type (meetings, tasks, personal events)
- **Combined View**: Merges calendar events and tasks for comprehensive scheduling

## API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

#### `GET /api/auth/google`
Initiates Google OAuth authentication flow.

#### `GET /api/auth/google/callback`
OAuth callback endpoint (handled automatically).

#### `GET /api/auth/logout`
Logs out the current user.

#### `GET /api/auth/me`
Returns the current authenticated user's information.

### Gmail Endpoints

#### `GET /api/gmail/labels`
Retrieves all Gmail labels.

#### `GET /api/gmail/emails`
Retrieves emails with pagination support.
- Query parameters:
  - `label`: Label ID (e.g., 'INBOX', 'STARRED')
  - `q`: Search query
  - `pageToken`: Pagination token
  - `maxResults`: Number of results (default: 20)

#### `GET /api/gmail/emails/:id`
Retrieves a specific email by ID.

#### `POST /api/gmail/emails/:id/read`
Marks an email as read.

#### `POST /api/gmail/emails/:id/unread`
Marks an email as unread.

#### `POST /api/gmail/emails/:id/star`
Toggles star status of an email.

#### `POST /api/gmail/emails/:id/delete`
Deletes an email.

#### `POST /api/gmail/emails/batch-read`
Marks multiple emails as read.

#### `POST /api/gmail/emails/batch-delete`
Deletes multiple emails.

#### `POST /api/gmail/send`
Sends an email.
- Body: `{ to, subject, body, replyTo }`

### Task Endpoints

#### `GET /api/tasks`
Retrieves all tasks for the authenticated user.

#### `POST /api/tasks`
Creates a new task.
- Body: `{ title, description, priority, isUrgent, deadline, status }`

#### `GET /api/tasks/:id`
Retrieves a specific task.

#### `PUT /api/tasks/:id`
Updates a task.

#### `PUT /api/tasks/:id/move`
Moves a task to a different status (for drag-and-drop).
- Body: `{ status, newIndex }`

#### `DELETE /api/tasks/:id`
Deletes a task.

#### `GET /api/tasks/stats`
Retrieves task statistics.

### Calendar Endpoints

#### `GET /api/calendar/events`
Retrieves calendar events for a date range.
- Query parameters:
  - `startDate`: Start date (ISO format)
  - `endDate`: End date (ISO format)

### Stress Logs Endpoints

#### `GET /api/stress-logs`
Retrieves stress logs for a time range.
- Query parameters:
  - `days`: Number of days (1, 7, or 30)

#### `GET /api/stress-logs/statistics`
Retrieves stress statistics for a time range.
- Query parameters:
  - `days`: Number of days (1, 7, or 30)

#### `POST /api/stress-logs`
Creates a new stress log entry.
- Body: `{ stressLevel, stressScore, source }`

### Facial Analysis Endpoints

#### `POST /api/facial-analysis/analyze`
Analyzes a facial image for stress indicators.
- Body: `{ image: base64EncodedImage }`
- Returns: Analysis results with stress indicators

### Settings Endpoints

#### `GET /api/settings`
Retrieves user settings including notification preferences, facial analysis settings, and Zen Mode preferences.

#### `PUT /api/settings`
Updates user settings.
- Body: `{ notifications: { email, stressAlerts }, facialAnalysis: { enabled, frequency }, zenMode: { autoEnabled } }`

### Health Check

#### `GET /api/health`
Returns API health status and service availability.

## Environment Variables

The `.env` file is provided in the repository at `server/.env` with all credentials pre-configured and ready to use.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/zenflow` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |
| `SESSION_SECRET` | Session encryption secret | Random secure string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:5001/api/auth/google/callback` |
| `AZURE_FACE_API_KEY` | Azure Face API key | None (optional) |
| `AZURE_FACE_API_ENDPOINT` | Azure Face API endpoint | None (optional) |

## Testing

The application includes test suites for both client and server:

- **Server Tests**: Test files covering all API routes, services, and utilities
- **Client Tests**: Test files covering React components, hooks, contexts, and utilities
- **Test Framework**: 
  - **Server**: Jest with ES modules support
  - **Client**: Vitest with React Testing Library
- **Test Environment**: Node.js with ES modules support for server tests

### Running Tests

#### Run All Tests

**Server tests:**
```bash
cd server
npm test
```

**Client tests:**
```bash
cd client
npm test
```

#### Test Commands

**Server:**
- `npm test` - Run all server tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

**Client:**
- `npm test` - Run all client tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Test Structure

#### Server Tests

Server tests are located in `server/src/**/__tests__/`

**Testing Approach:**
- **Unit Tests**: Mock external dependencies (Mongoose models, external APIs)
- **Mocking Strategy**: Comprehensive mocking of external services, authentication, and database models
- **Console Suppression**: Expected console logs and errors are suppressed during test execution

#### Client Tests

Client tests are located in `client/src/**/__tests__/`

**Testing Approach:**
- **Components**: Use React Testing Library for accessible, user-centric tests
- **Mocking**: Mock API calls, external services, and browser APIs
- **Accessibility**: Tests verify ARIA labels and screen reader compatibility

### Test Configuration

- **Server Jest Configuration**: Configured for ES modules with `--experimental-vm-modules`
- **Client Vitest Configuration**: Configured for React components with jsdom environment
- **Test Environment**: 
  - Server: Node.js environment
  - Client: jsdom environment for browser simulation
- **Mock Setup**: Global console suppression in `server/src/test/setup.js` to keep test output clean
- **Coverage Reports**: HTML and LCOV coverage reports generated for both client and server

## Development

### Code Structure

The application follows a modular architecture:

- **Components**: Reusable UI components organized by feature
- **Contexts**: Global state management using React Context API
- **Hooks**: Custom hooks for reusable logic
- **Pages**: Top-level route components
- **Utils**: Utility functions and helpers
- **Services**: Backend service integrations
- **Routes**: API endpoint definitions
- **Models**: Database schemas

### Adding New Features

1. **Frontend Component**
   - Create component in appropriate directory
   - Add JSDoc comments
   - Export from index if needed
   - Write tests in `__tests__/` directory

2. **Backend Route**
   - Create route file in `server/src/routes/`
   - Add route handler functions
   - Register in `server/src/index.js`
   - Write tests in `server/src/routes/__tests__/`

3. **Database Model**
   - Create model in `server/src/models/`
   - Define schema with Mongoose
   - Export from `server/src/models/index.js`

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
- Ensure MongoDB is running locally or check your MongoDB Atlas connection string
- Verify `MONGODB_URI` in `.env` file

**2. Google OAuth Error**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that redirect URI matches in Google Cloud Console
- Ensure required APIs are enabled

**3. Azure Face API Error**
- Verify API key and endpoint are correct
- Check Azure subscription status
- Facial analysis is optional - app works without it

**4. CORS Errors**
- Ensure `CLIENT_URL` in server `.env` matches your frontend URL
- Check CORS configuration in `server/src/index.js`

**5. Port Already in Use**
- Change `PORT` in `.env` file
- Or stop the process using the port

### Getting Help

- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
- Check that MongoDB and external services are accessible

---

**ZenFlow** - Helping you maintain a healthy work-life balance through intelligent stress management and productivity tools.
