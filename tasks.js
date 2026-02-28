/* ============================================
   AXION - Tasks JavaScript
   ============================================ */

let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
    await initTasksPage();
});

async function initTasksPage() {
    // Skip auth check for easier testing
    await loadTasks();
    initSidebar();
    initTaskModal();
    initFilters();
    initSearch();
    initTaskActions();
    renderTasks();
    updateStats();
}

async function loadTasks() {
    const loadedTasks = await window.AXION.tasks.load();
    // Ensure all task IDs are numbers for consistent comparison
    tasks = loadedTasks.map(task => ({
        ...task,
        id: Number(task.id)
    }));
}

function initSidebar() {
    const collapseBtn = document.querySelector('.collapse-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            sidebarOverlay?.classList.toggle('active');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        });
    }
}

function initTaskModal() {
    const modal = document.getElementById('taskModal');
    const addTaskBtn = document.querySelector('.add-task-btn');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('taskForm');
    const cancelBtn = form?.querySelector('.btn-cancel');

    addTaskBtn?.addEventListener('click', () => openModal());
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate')
        };

        if (form.dataset.taskId) {
            await window.AXION.tasks.update(form.dataset.taskId, taskData);
            window.AXION.ui.showNotification('Task updated successfully!', 'success');
        } else {
            await window.AXION.tasks.add(taskData);
            window.AXION.ui.showNotification('Task added successfully!', 'success');
        }

        await loadTasks();
        renderTasks();
        updateStats();
        
        closeModal();
        form.reset();
        delete form.dataset.taskId;
    });
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

function initSearch() {
    const searchInput = document.querySelector('.search-tasks');
    
    searchInput?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTasks();
    });
}

function initTaskActions() {
    document.addEventListener('click', async (e) => {
        const checkbox = e.target.closest('.task-checkbox');
        const editBtn = e.target.closest('.task-edit');
        const deleteBtn = e.target.closest('.task-delete');

        if (checkbox) {
            const taskItem = checkbox.closest('.task-item');
            const taskId = taskItem?.dataset.taskId;
            if (taskId) {
                await handleToggleComplete(taskId);
            }
        }

        if (editBtn) {
            const taskItem = editBtn.closest('.task-item');
            const taskId = taskItem?.dataset.taskId;
            if (taskId) {
                handleEditTask(taskId);
            }
        }

        if (deleteBtn) {
            const taskItem = deleteBtn.closest('.task-item');
            const taskId = taskItem?.dataset.taskId;
            if (taskId) {
                await handleDeleteTask(taskId);
            }
        }
    });
}

async function handleToggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const wasCompleted = task?.completed;
    
    await window.AXION.tasks.toggleComplete(taskId);
    await loadTasks();
    renderTasks();
    updateStats();
    
    // Show confetti if task was just completed
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask?.completed && !wasCompleted) {
        window.AXION.ui.showConfetti();
    }
}

function handleEditTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const form = document.getElementById('taskForm');
    form.dataset.taskId = taskId;
    
    form.querySelector('input[name="title"]').value = task.title;
    form.querySelector('textarea[name="description"]').value = task.description || '';
    form.querySelector('select[name="category"]').value = task.category;
    form.querySelector('select[name="priority"]').value = task.priority;
    form.querySelector('input[name="dueDate"]').value = task.dueDate;

    openModal();
}

async function handleDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        await window.AXION.tasks.delete(taskId);
        await loadTasks();
        renderTasks();
        updateStats();
        window.AXION.ui.showNotification('Task deleted successfully!', 'success');
    }
}

function openModal() {
    const modal = document.getElementById('taskModal');
    modal?.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    
    modal?.classList.remove('show');
    form?.reset();
    delete form.dataset.taskId;
}

function getFilteredTasks() {
    let filtered = [...tasks];
    
    if (currentFilter === 'completed') {
        filtered = filtered.filter(t => t.completed);
    } else if (currentFilter === 'pending') {
        filtered = filtered.filter(t => !t.completed);
    }
    
    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchQuery) ||
            t.description?.toLowerCase().includes(searchQuery) ||
            t.category.toLowerCase().includes(searchQuery)
        );
    }
    
    return filtered;
}

function renderTasks() {
    const taskList = document.querySelector('.task-list');
    if (!taskList) return;

    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>🎉 No tasks yet. Add your first task!</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filtered.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                    <span class="task-category">${task.category}</span>
                    <span class="task-date">${window.AXION.utils.formatDate(task.dueDate)}</span>
                </div>
            </div>
            <button class="task-edit btn-ghost" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="task-delete btn-ghost" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>
    `).join('');
}

async function updateStats() {
    const stats = await window.AXION.tasks.getStats();
    
    const todayCount = document.querySelector('.stat-today .stat-value');
    const completedCount = document.querySelector('.stat-completed .stat-value');
    const pendingCount = document.querySelector('.stat-pending .stat-value');
    const productivityValue = document.querySelector('.stat-productivity .progress-value');

    if (todayCount) todayCount.textContent = stats.tasksToday;
    if (completedCount) completedCount.textContent = stats.completed;
    if (pendingCount) pendingCount.textContent = stats.pending;
    if (productivityValue) productivityValue.textContent = stats.productivity + '%';

    const progressCircle = document.querySelector('.progress-ring .progress');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 32;
        const offset = circumference - (stats.productivity / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
