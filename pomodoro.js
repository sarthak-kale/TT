/* ============================================
   AXION - Pomodoro Timer JavaScript
   ============================================ */

// Timer state
let timerInterval = null;
let timeRemaining = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let currentMode = 'focus';
let sessionCount = 0;
let totalMinutes = 0;
let streak = 0;

// Timer settings (in minutes)
const TIMER_MODES = {
    'focus': 25,
    'short-break': 5,
    'long-break': 15
};

// Pomodoro stats
let pomodoroStats = {
    todaySessions: 0,
    todayMinutes: 0,
    todayTasks: 0,
    lastDate: new Date().toDateString(),
    sessions: [],
    streak: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initPomodoroPage();
});

async function initPomodoroPage() {
    // Check auth
    if (!window.AXION.auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize UI components
    initSidebar();
    
    // Load stats
    loadPomodoroStats();
    
    // Load tasks for selector
    await loadTasksForSelector();
    
    // Initialize timer
    initTimer();
    
    // Update user info
    loadUserInfo();
}

function initSidebar() {
    // Handle sidebar collapse
    const collapseBtn = document.querySelector('.collapse-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Handle mobile menu
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
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        window.AXION.auth.logout();
    });
}

function loadUserInfo() {
    const user = window.AXION.auth.getCurrentUser();
    if (user) {
        const userName = document.querySelector('.user-name');
        const userEmail = document.querySelector('.user-email');
        const userAvatar = document.querySelector('.user-avatar');
        
        if (userName) userName.textContent = user.name || 'User';
        if (userEmail) userEmail.textContent = user.email || '';
        if (userAvatar) userAvatar.textContent = user.avatar || 'U';
    }
}

function loadPomodoroStats() {
    const stored = window.AXION.storage.load('axion_pomodoro_stats');
    if (stored) {
        pomodoroStats = stored;
        
        // Reset daily stats if new day
        const today = new Date().toDateString();
        if (pomodoroStats.lastDate !== today) {
            pomodoroStats.todaySessions = 0;
            pomodoroStats.todayMinutes = 0;
            pomodoroStats.lastDate = today;
            savePomodoroStats();
        }
    }
    
    updateStatsDisplay();
}

function savePomodoroStats() {
    window.AXION.storage.save('axion_pomodoro_stats', pomodoroStats);
}

async function loadTasksForSelector() {
    const taskSelect = document.getElementById('taskSelect');
    if (!taskSelect) return;
    
    const tasks = await window.AXION.tasks.load();
    const pendingTasks = tasks.filter(t => !t.completed);
    
    taskSelect.innerHTML = '<option value="">Select a task...</option>';
    
    pendingTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        taskSelect.appendChild(option);
    });
}

function initTimer() {
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');
    const skipBtn = document.getElementById('skipBtn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    // Play/Pause
    playBtn?.addEventListener('click', toggleTimer);
    
    // Reset
    resetBtn?.addEventListener('click', resetTimer);
    
    // Skip
    skipBtn?.addEventListener('click', skipSession);
    
    // Mode selection
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            setMode(mode);
        });
    });
    
    // Update timer display
    updateTimerDisplay();
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    isRunning = true;
    
    const playIcon = document.getElementById('playIcon');
    playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            completeSession();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    
    const playIcon = document.getElementById('playIcon');
    playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    pauseTimer();
    timeRemaining = TIMER_MODES[currentMode] * 60;
    updateTimerDisplay();
}

function skipSession() {
    pauseTimer();
    completeSession();
}

function completeSession() {
    pauseTimer();
    
    // Play sound
    const soundEnabled = document.getElementById('soundToggle')?.checked;
    if (soundEnabled) {
        playNotificationSound();
    }
    
    // Show notification
    if (currentMode === 'focus') {
        sessionCount++;
        totalMinutes += TIMER_MODES[currentMode];
        
        // Update stats
        pomodoroStats.todaySessions++;
        pomodoroStats.todayMinutes += TIMER_MODES[currentMode];
        pomodoroStats.sessions.push({
            date: new Date().toISOString(),
            duration: TIMER_MODES[currentMode]
        });
        
        // Update streak
        const today = new Date().toDateString();
        if (pomodoroStats.lastDate !== today) {
            pomodoroStats.streak = 0;
        }
        pomodoroStats.streak++;
        pomodoroStats.lastDate = today;
        
        savePomodoroStats();
        updateStatsDisplay();
        
        window.AXION.ui.showNotification('Great job! Focus session complete! 🎉', 'success');
        
        // Auto-switch to break
        if (sessionCount % 4 === 0) {
            setMode('long-break');
        } else {
            setMode('short-break');
        }
    } else {
        window.AXION.ui.showNotification('Break is over! Ready to focus?', 'info');
        setMode('focus');
    }
}

function setMode(mode) {
    currentMode = mode;
    
    // Update mode buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update progress circle
    const progress = document.getElementById('timerProgress');
    progress.className = 'timer-circle-progress ' + mode;
    
    // Reset and set time
    timeRemaining = TIMER_MODES[mode] * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    const timerTime = document.getElementById('timerTime');
    timerTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update progress circle
    const progress = document.getElementById('timerProgress');
    const totalTime = TIMER_MODES[currentMode] * 60;
    const progressPercent = (totalTime - timeRemaining) / totalTime;
    const circumference = 2 * Math.PI * 140;
    progress.style.strokeDashoffset = circumference * (1 - progressPercent);
    
    // Update session count
    document.getElementById('sessionCount').textContent = sessionCount;
    document.getElementById('totalMinutes').textContent = totalMinutes;
    document.getElementById('streakCount').textContent = pomodoroStats.streak;
}

function updateStatsDisplay() {
    document.getElementById('todaySessions').textContent = pomodoroStats.todaySessions;
    document.getElementById('todayMinutes').textContent = pomodoroStats.todayMinutes;
    document.getElementById('todayTasks').textContent = pomodoroStats.todayTasks;
}

function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}
