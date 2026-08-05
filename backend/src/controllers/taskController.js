const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const { search, category, priority, status, archived, sortBy } = req.query;

    let query = { user: req.user.id, isArchived: archived === 'true' };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (status) query.status = status;

    let sortOptions = { isPinned: -1, createdAt: -1 }; 
    if (sortBy === 'oldest') sortOptions = { isPinned: -1, createdAt: 1 };
    if (sortBy === 'dueDate') sortOptions = { isPinned: -1, dueDate: 1 };
    if (sortBy === 'priority') sortOptions = { isPinned: -1, priority: -1 };

    const tasks = await Task.find(query).sort(sortOptions);
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.body.status === 'Completed' && task.status !== 'Completed') {
      req.body.completedAt = new Date();
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const total = await Task.countDocuments({ user: userId, isArchived: false });
    const completed = await Task.countDocuments({ user: userId, status: 'Completed', isArchived: false });
    const pending = await Task.countDocuments({ user: userId, status: 'Pending', isArchived: false });
    
    const now = new Date();
    const overdue = await Task.countDocuments({
      user: userId,
      status: { $ne: 'Completed' },
      dueDate: { $lt: now },
      isArchived: false
    });

    res.status(200).json({
      success: true,
      stats: { total, completed, pending, overdue }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};