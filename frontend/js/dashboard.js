const API_URL = 'http://localhost:5000/api/v1/tasks';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

let activeStatusFilter = '';

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  document.getElementById('username-display').textContent = user.username || 'User';

  initTheme();
  
  fetchStats();
  fetchTasks();

  document.querySelectorAll('.nav-links .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-links .nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      activeStatusFilter = item.getAttribute('data-status');
      fetchTasks();
    });
  });

  const modal = document.getElementById('task-modal');
  document.getElementById('open-modal-btn').onclick = () => modal.style.display = 'flex';
  document.getElementById('close-modal').onclick = () => modal.style.display = 'none';

  document.getElementById('theme-toggle').onclick = toggleTheme;

  document.getElementById('logout-btn').onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  document.getElementById('search-input').addEventListener('input', fetchTasks);
  document.getElementById('category-filter').addEventListener('change', fetchTasks);
  document.getElementById('priority-filter').addEventListener('change', fetchTasks);
  document.getElementById('sort-filter').addEventListener('change', fetchTasks);

  document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = {
      title: document.getElementById('task-title').value,
      description: document.getElementById('task-desc').value,
      priority: document.getElementById('task-priority').value,
      category: document.getElementById('task-category').value,
      dueDate: document.getElementById('task-due').value
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        modal.style.display = 'none';
        document.getElementById('task-form').reset();
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      console.error("Task Creation Error:", err);
    }
  });
});

function initTheme() {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeButton(currentTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const themeBtn = document.getElementById('theme-toggle');
  themeBtn.innerHTML = theme === 'dark' 
    ? '<i class="fa-solid fa-sun"></i> Light Mode' 
    : '<i class="fa-solid fa-moon"></i> Dark Mode';
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { stats } = await res.json();
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-overdue').textContent = stats.overdue;
  } catch (err) {
    console.error("Stats Fetch Error:", err);
  }
}

async function fetchTasks() {
  const search = document.getElementById('search-input').value;
  const category = document.getElementById('category-filter').value;
  const priority = document.getElementById('priority-filter').value;
  const sortBy = document.getElementById('sort-filter').value;

  const url = `${API_URL}?search=${encodeURIComponent(search)}&category=${category}&priority=${priority}&status=${activeStatusFilter}&sortBy=${sortBy}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { data } = await res.json();
    renderTasks(data);
  } catch (err) {
    console.error("Tasks Fetch Error:", err);
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('task-container');
  container.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); margin-top: 2rem;">No tasks found.</p>`;
    return;
  }

  tasks.forEach((task) => {
    const isCompleted = task.status === 'Completed';
    const formattedDate = task.dueDate 
      ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
      : 'No due date';

    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
      <div>
        <div class="task-header">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
        </div>
        <p class="task-desc">${escapeHtml(task.description) || 'No description added.'}</p>
      </div>

      <div class="task-meta">
        <span class="badge badge-${task.priority.toLowerCase()}">${task.priority}</span>
        <span class="badge badge-category"><i class="fa-solid fa-folder"></i> ${task.category}</span>
      </div>

      <div class="task-footer">
        <span class="due-date"><i class="fa-solid fa-calendar-days"></i> ${formattedDate}</span>
        <div class="card-actions">
          <button onclick="toggleComplete('${task._id}', '${task.status}')" class="btn-icon" title="${isCompleted ? 'Mark Pending' : 'Mark Completed'}">
            <i class="fa-solid ${isCompleted ? 'fa-rotate-left' : 'fa-check'}"></i>
          </button>
          <button onclick="deleteTask('${task._id}')" class="btn-icon danger" title="Delete Task">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

async function toggleComplete(id, currentStatus) {
  const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: nextStatus })
  });
  fetchTasks();
  fetchStats();
}

async function deleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTasks();
    fetchStats();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}