/* ============================================
   AXION - Calendar JavaScript
   ============================================ */

// Calendar state
let events = [];
let currentDate = new Date();
let selectedDate = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initCalendarPage();
});

async function initCalendarPage() {
    // Check auth
    if (!window.AXION.auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize UI components
    initSidebar();
    initEventModal();
    
    // Load events
    await loadEvents();
    
    // Render calendar
    renderCalendar();
    
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

async function loadEvents() {
    const storedEvents = window.AXION.storage.load('axion_events');
    events = storedEvents || [];
}

function saveEvents() {
    window.AXION.storage.save('axion_events', events);
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarTitle = document.getElementById('calendarTitle');
    
    if (!calendarGrid) return;
    
    // Set calendar title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear grid
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Previous month days
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<span class="calendar-day-number">${prevMonthLastDay - i}</span>`;
        calendarGrid.appendChild(day);
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= totalDays; i++) {
        const day = document.createElement('div');
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        day.className = 'calendar-day';
        day.dataset.date = dateStr;
        
        // Check if today
        if (i === today.getDate() && currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear()) {
            day.classList.add('today');
        }
        
        // Check if selected
        if (i === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && 
            currentDate.getFullYear() === selectedDate.getFullYear()) {
            day.classList.add('selected');
            day.style.borderColor = 'var(--gradient-pink)';
        }
        
        // Add day number
        day.innerHTML = `<span class="calendar-day-number">${i}</span>`;
        
        // Add events
        const dayEvents = events.filter(e => e.date === dateStr);
        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'calendar-events';
            
            dayEvents.slice(0, 2).forEach(event => {
                const eventEl = document.createElement('div');
                eventEl.className = `calendar-event ${event.category}`;
                eventEl.textContent = event.time ? `${event.time} ${event.title}` : event.title;
                eventsContainer.appendChild(eventEl);
            });
            
            if (dayEvents.length > 2) {
                const moreEl = document.createElement('div');
                moreEl.className = 'calendar-event';
                moreEl.style.background = 'rgba(255,255,255,0.2)';
                moreEl.textContent = `+${dayEvents.length - 2} more`;
                eventsContainer.appendChild(moreEl);
            }
            
            day.appendChild(eventsContainer);
        }
        
        // Click handler
        day.addEventListener('click', () => {
            selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            renderCalendar();
            renderEventList();
        });
        
        calendarGrid.appendChild(day);
    }
    
    // Next month days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let i = 1; i <= remainingDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<span class="calendar-day-number">${i}</span>`;
        calendarGrid.appendChild(day);
    }
    
    // Render event list
    renderEventList();
}

function renderEventList() {
    const eventList = document.getElementById('eventList');
    const eventsTitle = document.getElementById('eventsTitle');
    
    if (!eventList) return;
    
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateStr).sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
    
    // Update title
    const today = new Date();
    if (selectedDate.toDateString() === today.toDateString()) {
        eventsTitle.textContent = "Today's Events";
    } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        eventsTitle.textContent = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()} Events`;
    }
    
    if (dayEvents.length === 0) {
        eventList.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No events for this day</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Click + to add an event</p>
            </div>
        `;
        return;
    }
    
    eventList.innerHTML = dayEvents.map(event => `
        <div class="event-item" data-event-id="${event.id}">
            <div class="event-time">${event.time || '--:--'}</div>
            <div class="event-details">
                <div class="event-name">${escapeHtml(event.title)}</div>
                <div class="event-category">${event.category}</div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    eventList.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            editEvent(eventId);
        });
    });
}

function initEventModal() {
    const modal = document.getElementById('eventModal');
    const addEventBtn = document.getElementById('addEventBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const eventForm = document.getElementById('eventForm');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    
    // Open modal
    addEventBtn?.addEventListener('click', () => {
        openModal();
    });
    
    // Close modal
    closeModal?.addEventListener('click', closeModalFunc);
    cancelBtn?.addEventListener('click', closeModalFunc);
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFunc();
    });
    
    // Navigation
    prevMonth?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonth?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    todayBtn?.addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = new Date();
        renderCalendar();
    });
    
    // Form submit
    eventForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(eventForm);
        const eventIdInput = document.getElementById('eventId');
        const eventId = eventIdInput?.value;
        
        const eventData = {
            title: formData.get('eventTitle'),
            date: formData.get('eventDate'),
            time: formData.get('eventTime'),
            category: formData.get('eventCategory'),
            description: formData.get('eventDescription')
        };
        
        if (eventId) {
            // Update existing
            const index = events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                events[index] = { ...events[index], ...eventData };
            }
            window.AXION.ui.showNotification('Event updated!', 'success');
        } else {
            // Add new
            eventData.id = Date.now().toString();
            events.push(eventData);
            window.AXION.ui.showNotification('Event added!', 'success');
        }
        
        saveEvents();
        closeModalFunc();
        renderCalendar();
        
        eventForm.reset();
        if (eventIdInput) eventIdInput.value = '';
    });
}

function openModal() {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const dateInput = document.getElementById('eventDate');
    
    // Set default date to selected date
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    dateInput.value = dateStr;
    
    document.getElementById('modalTitle').textContent = 'Add Event';
    const eventIdInput = document.getElementById('eventId');
    if (eventIdInput) eventIdInput.value = '';
    
    modal?.classList.add('show');
}

function closeModalFunc() {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    
    modal?.classList.remove('show');
    form?.reset();
}

function editEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    
    document.getElementById('modalTitle').textContent = 'Edit Event';
    const eventIdInput = document.getElementById('eventId');
    if (eventIdInput) eventIdInput.value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time || '';
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventDescription').value = event.description || '';
    
    modal?.classList.add('show');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
