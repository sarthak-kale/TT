/* ============================================
   AXION - Main Application JavaScript
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    STORAGE_KEYS: {
        USER: 'axion_user',
        TASKS: 'axion_tasks',
        SETTINGS: 'axion_settings'
    },
    DEMO_DATA_PATH: 'data/demoTasks.json'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
}

function getPriorityClass(priority) {
    return `priority-${priority}`;
}

function getCategoryClass(category) {
    return `category-${category.toLowerCase()}`;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return null;
    }
}

function clearStorage(key) {
    try {
        if (key) {
            localStorage.removeItem(key);
        } else {
            Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        }
        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
}

// ============================================
// AUTH FUNCTIONS
// ============================================

function isLoggedIn() {
    return loadFromStorage(CONFIG.STORAGE_KEYS.USER) !== null;
}

function getCurrentUser() {
    return loadFromStorage(CONFIG.STORAGE_KEYS.USER);
}

function loginUser(email, password, rememberMe = false) {
    return new Promise((resolve, reject) => {
        if (email === 'demo@axion.app' && password === 'demo123') {
            const user = { email: 'demo@axion.app', name: 'Demo User', avatar: 'DU' };
            saveToStorage(CONFIG.STORAGE_KEYS.USER, user);
            resolve(user);
        } else if (email && password) {
            const user = { email: email, name: email.split('@')[0], avatar: email.charAt(0).toUpperCase() };
            saveToStorage(CONFIG.STORAGE_KEYS.USER, user);
            resolve(user);
        } else {
            reject(new Error('Invalid email or password'));
        }
    });
}

function logoutUser() {
    clearStorage(CONFIG.STORAGE_KEYS.USER);
    window.location.href = 'index.html';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// TASK FUNCTIONS
// ============================================

// Get tasks from localStorage
function getTasks() {
    const tasks = loadFromStorage(CONFIG.STORAGE_KEYS.TASKS);
    return tasks || [];
}

// Load tasks (async wrapper for compatibility)
async function loadTasks() {
    return getTasks();
}

// Save tasks to localStorage
function saveTasks(tasks) {
    return saveToStorage(CONFIG.STORAGE_KEYS.TASKS, tasks);
}

// Add a new task
function addTask(taskData) {
    const tasks = getTasks();
    const newTask = {
        id: Date.now(),
        title: taskData.title || "",
        category: taskData.category || "Personal",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate || "",
        completed: false
    };
    tasks.unshift(newTask);
    saveTasks(tasks);
    return newTask;
}

// Update an existing task
function updateTask(taskId, updates) {
    const tasks = getTasks();
    const numericId = Number(taskId);
    const index = tasks.findIndex(t => Number(t.id) === numericId);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        saveTasks(tasks);
        return tasks[index];
    }
    return null;
}

// Delete a task
function deleteTask(taskId) {
    const tasks = getTasks();
    const numericId = Number(taskId);
    const filteredTasks = tasks.filter(t => Number(t.id) !== numericId);
    saveTasks(filteredTasks);
    return true;
}

// Toggle task completion
function toggleTaskComplete(taskId) {
    const tasks = getTasks();
    const numericId = Number(taskId);
    const task = tasks.find(t => Number(t.id) === numericId);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        return task;
    }
    return null;
}

// Get task statistics
async function getTaskStats() {
    const tasks = getTasks();
    const today = new Date().toISOString().split('T')[0];
    const tasksToday = tasks.filter(t => t.dueDate === today).length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const productivity = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return { tasksToday, completed, pending, productivity, total: tasks.length };
}

// ============================================
// UI FUNCTIONS
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<div class="notification-content"><span>${message}</span></div>`;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'rgba(76, 201, 240, 0.9)' : type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 'rgba(247, 37, 133, 0.9)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function createStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }
}

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
}

function protectPage() {
    if (!isLoggedIn() && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
        window.location.href = 'login.html';
    }
}

function redirectIfLoggedIn() {
    if (isLoggedIn() && window.location.pathname.includes('login.html')) {
        window.location.href = 'dashboard.html';
    }
}

// ============================================
// INTRO ANIMATION
// ============================================

function initIntroAnimation() {
    const introOverlay = document.getElementById('introOverlay');
    if (!introOverlay) return;
    const introPlayed = sessionStorage.getItem('axion_intro_played');
    if (introPlayed) {
        introOverlay.style.display = 'none';
        return;
    }
    sessionStorage.setItem('axion_intro_played', 'true');
    setTimeout(() => {
        introOverlay.classList.add('hidden');
        setTimeout(() => {
            introOverlay.style.display = 'none';
        }, 800);
    }, 2500);
}

// ============================================
// SERVICE WORKER
// ============================================

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// ============================================
// CONFETTI ANIMATION
// ============================================

function showConfetti() {
    const colors = ['#ff6b35', '#f72585', '#7209b7', '#4cc9f0'];
    const confettiCount = 50;
    const container = document.body;
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}vw;
            z-index: 10000;
            pointer-events: none;
            animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
        `;
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    createStars();
    initNavbar();
    initMobileMenu();
    initScrollReveal();
    initIntroAnimation();
    initServiceWorker();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes confettiFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// ============================================
// EXPORTS
// ============================================

window.AXION = {
    CONFIG,
    utils: { generateId, formatDate, formatTime, getRelativeTime, getPriorityClass, getCategoryClass },
    storage: { save: saveToStorage, load: loadFromStorage, clear: clearStorage },
    auth: { isLoggedIn, getCurrentUser, login: loginUser, logout: logoutUser, validateEmail },
    tasks: { load: loadTasks, getTasks: getTasks, save: saveTasks, add: addTask, update: updateTask, delete: deleteTask, toggleComplete: toggleTaskComplete, getStats: getTaskStats },
    ui: { showNotification, protectPage, redirectIfLoggedIn, showConfetti }
};
