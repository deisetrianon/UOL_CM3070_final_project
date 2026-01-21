import mongoose from 'mongoose';

/**
 * Task Schema
 * Stores user tasks for the Task Manager feature
 * Tasks are organized in columns (Kanban-style) and support drag-and-drop
 */
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  deadline: {
    type: Date,
    index: true
  },
  // Position within the column for drag-and-drop ordering
  position: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  labels: [{
    type: String,
    trim: true
  }],
  estimatedTime: {
    type: Number,
    min: 0
  },
  actualTime: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'tasks'
});

// Compound indexes for common queries
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, deadline: 1 });
taskSchema.index({ userId: 1, status: 1, position: 1 });

taskSchema.statics.getTasksByUser = async function(userId) {
  const tasks = await this.find({ userId }).sort({ position: 1, createdAt: -1 });
  
  return {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done')
  };
};

taskSchema.statics.getOverdueTasks = async function(userId) {
  const now = new Date();
  return this.find({
    userId,
    status: { $ne: 'done' },
    deadline: { $lt: now }
  }).sort({ deadline: 1 });
};

taskSchema.statics.getUrgentTasks = async function(userId) {
  return this.find({
    userId,
    status: { $ne: 'done' },
    $or: [
      { isUrgent: true },
      { priority: 'urgent' }
    ]
  }).sort({ deadline: 1 });
};

// Moving task to a new position/column
taskSchema.methods.moveTo = async function(newStatus, newPosition) {
  const oldStatus = this.status;
  const wasCompleted = oldStatus !== 'done' && newStatus === 'done';
  
  this.status = newStatus;
  this.position = newPosition;
  
  if (wasCompleted) {
    this.completedAt = new Date();
  } else if (newStatus !== 'done') {
    this.completedAt = undefined;
  }
  
  return this.save();
};

// Converting task to client-safe JSON
taskSchema.methods.toClientJSON = function() {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    status: this.status,
    priority: this.priority,
    isUrgent: this.isUrgent,
    deadline: this.deadline,
    position: this.position,
    completedAt: this.completedAt,
    labels: this.labels,
    estimatedTime: this.estimatedTime,
    actualTime: this.actualTime,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

taskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline || this.status === 'done') return false;
  return new Date() > this.deadline;
});

taskSchema.virtual('isDueSoon').get(function() {
  if (!this.deadline || this.status === 'done') return false;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return this.deadline > now && this.deadline <= tomorrow;
});

// Ensuring virtuals are included in JSON output
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
