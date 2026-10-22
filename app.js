// Simple Event Countdown App
// Stores events in localStorage so they persist between visits

const STORAGE_KEY = "event-countdowns";

let events = [];

// DOM elements
const form = document.getElementById("event-form");
const eventsContainer = document.getElementById("events-container");
const nameInput = document.getElementById("event-name");
const dateInput = document.getElementById("event-date");
const timeInput = document.getElementById("event-time");

// Load events from localStorage
function loadEvents() {
  const saved = localStorage.getItem(STORAGE_KEY);
  events = saved ? JSON.parse(saved) : [];
}

// Save events to localStorage
function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// Format a date for display
function formatDateTime(dateStr, timeStr) {
  const date = new Date(dateStr + (timeStr ? "T" + timeStr : "T00:00"));
  const options = { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  };
  let formatted = date.toLocaleDateString(undefined, options);
  if (timeStr) {
    formatted += " at " + timeStr;
  } else {
    formatted += " (all day)";
  }
  return formatted;
}

// Calculate time remaining
function getTimeRemaining(targetDate) {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    return { past: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { past: false, days, hours, minutes, seconds };
}

// Render all events
function renderEvents() {
  if (events.length === 0) {
    eventsContainer.innerHTML = '<div class="empty-state">No events yet. Add one above!</div>';
    return;
  }

  // Sort by date (soonest first)
  const sorted = [...events].sort((a, b) => {
    const dateA = new Date(a.date + (a.time ? "T" + a.time : "T00:00"));
    const dateB = new Date(b.date + (b.time ? "T" + b.time : "T00:00"));
    return dateA - dateB;
  });

  eventsContainer.innerHTML = sorted.map(event => {
    const target = new Date(event.date + (event.time ? "T" + event.time : "T00:00"));
    const remaining = getTimeRemaining(target);
    const datetimeStr = formatDateTime(event.date, event.time);

    if (remaining.past) {
      return `
        <div class="event-card past-event">
          <div class="event-header">
            <div class="event-name">${escapeHtml(event.name)}</div>
            <button class="delete-btn" data-id="${event.id}">Delete</button>
          </div>
          <div class="event-datetime">${datetimeStr}</div>
          <div class="past-label">This event has already started / passed</div>
        </div>
      `;
    }

    return `
      <div class="event-card">
        <div class="event-header">
          <div class="event-name">${escapeHtml(event.name)}</div>
          <button class="delete-btn" data-id="${event.id}">Delete</button>
        </div>
        <div class="event-datetime">${datetimeStr}</div>
        <div class="countdown">
          <div class="time-unit">
            <span class="time-value">${remaining.days}</span>
            <span class="time-label">Days</span>
          </div>
          <div class="time-unit">
            <span class="time-value">${String(remaining.hours).padStart(2, "0")}</span>
            <span class="time-label">Hours</span>
          </div>
          <div class="time-unit">
            <span class="time-value">${String(remaining.minutes).padStart(2, "0")}</span>
            <span class="time-label">Minutes</span>
          </div>
          <div class="time-unit">
            <span class="time-value">${String(remaining.seconds).padStart(2, "0")}</span>
            <span class="time-label">Seconds</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Attach delete listeners
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteEvent(id);
    });
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Add new event
function addEvent(name, date, time) {
  const event = {
    id: Date.now().toString(),
    name: name.trim(),
    date,
    time: time || null
  };
  events.push(event);
  saveEvents();
  renderEvents();
}

// Delete event
function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveEvents();
  renderEvents();
}

// Form submit handler
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value;
  const date = dateInput.value;
  const time = timeInput.value;

  if (!name || !date) return;

  addEvent(name, date, time);

  // Reset form
  form.reset();
  nameInput.focus();
});

// Update countdowns every second
function startTimer() {
  setInterval(renderEvents, 1000);
}

// Initialize
loadEvents();
renderEvents();
startTimer();

// Set default date to today
dateInput.valueAsDate = new Date();
