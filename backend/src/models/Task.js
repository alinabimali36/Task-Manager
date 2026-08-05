const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: { type: String, trim: true, default: '' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending'
    },
    category: {
      type: String,
      default: 'Personal'
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    tags: [{ type: String }],
    subtasks: [subtaskSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);