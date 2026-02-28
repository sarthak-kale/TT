/* ============================================
   AXION - Analytics JavaScript
   ============================================ */

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initAnalyticsPage();
});

async function initAnalyticsPage() {
    // Check auth
    if (!window.AXION.auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize UI components
    initSidebar();
    
    // Load tasks and generate analytics
    const tasks = await window.AXION.tasks.load();
    generateAnalytics(tasks);
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
}

function generateAnalytics(tasks) {
    renderTasksPerDayChart(tasks);
    renderCompletedVsPendingChart(tasks);
    renderWeeklyProductivityChart(tasks);
    updateSummaryCards(tasks);
}

function renderTasksPerDayChart(tasks) {
    const canvas = document.getElementById('tasksPerDayChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 400;
    const height = canvas.height = 200;

    // Get last 7 days data
    const days = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayTasks = tasks.filter(t => t.createdAt.startsWith(dateStr));
        data.push(dayTasks.length);
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / data.length * 0.6;
    const gap = chartWidth / data.length * 0.4;
    const maxValue = Math.max(...data, 1);

    // Draw bars
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, '#f72585');
    gradient.addColorStop(1, '#7209b7');

    data.forEach((value, index) => {
        const x = padding.left + (chartWidth / data.length) * index + gap / 2;
        const barHeight = (value / maxValue) * chartHeight;
        const y = height - padding.bottom - barHeight;

        // Draw bar
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // Draw value on top
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth / 2, y - 8);

        // Draw label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(days[index], x + barWidth / 2, height - padding.bottom + 20);
    });
}

function renderCompletedVsPendingChart(tasks) {
    const canvas = document.getElementById('donutChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.parentElement.clientWidth || 200, 200);
    canvas.width = size;
    canvas.height = size;

    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const total = tasks.length || 1;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const lineWidth = 20;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw pending arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (pending / total) * 2 * Math.PI, false);
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.8)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw completed arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2 + (pending / total) * 2 * Math.PI, Math.PI * 1.5, false);
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.8)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw center text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round((completed / total) * 100) + '%', centerX, centerY - 8);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Inter';
    ctx.fillText('Completed', centerX, centerY + 16);
}

function renderWeeklyProductivityChart(tasks) {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 400;
    const height = canvas.height = 200;

    // Get last 7 days completed tasks
    const days = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const completedTasks = tasks.filter(t => 
            t.completed && t.completedAt && t.completedAt.startsWith(dateStr)
        );
        data.push(completedTasks.length);
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data, 1);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((value, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = height - padding.bottom - (value / maxValue) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw points
    data.forEach((value, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = height - padding.bottom - (value / maxValue) * chartHeight;

        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4cc9f0';
        ctx.fill();
        
        // Draw glow
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 201, 240, 0.3)';
        ctx.fill();

        // Draw value
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(value, x, y - 15);

        // Draw label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(days[index], x, height - padding.bottom + 20);
    });
}

function updateSummaryCards(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const productivityRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update values
    const totalEl = document.querySelector('.analytics-total .stat-value');
    const completedEl = document.querySelector('.analytics-completed .stat-value');
    const pendingEl = document.querySelector('.analytics-pending .stat-value');
    const rateEl = document.querySelector('.analytics-rate .stat-value');

    if (totalEl) totalEl.textContent = totalTasks;
    if (completedEl) completedEl.textContent = completedTasks;
    if (pendingEl) pendingEl.textContent = pendingTasks;
    if (rateEl) rateEl.textContent = productivityRate + '%';
}

// RoundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r[0]) r[0] = w / 2;
        if (h < 2 * r[0]) r[0] = h / 2;
        this.moveTo(x + r[0], y);
        this.arcTo(x + w, y, x + w, y + h, r[0]);
        this.arcTo(x + w, y + h, x, y + h, r[2] || r[0]);
        this.arcTo(x, y + h, x, y, r[2] || r[0]);
        this.arcTo(x, y, x + w, y, r[1] || r[0]);
        this.closePath();
        return this;
    };
}
