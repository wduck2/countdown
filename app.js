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
const unitInput = document.getElementById("event-unit");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const addBtn = document.getElementById("add-btn");
const addEventSection = document.getElementById("add-event-section");
const closeBtn = document.getElementById("close-btn");

let editingId = null;

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

function getDisplayValue(diffMs, unit) {
  const absDiff = Math.max(0, diffMs);
  const totalSeconds = Math.floor(absDiff / 1000);
  const totalMinutes = Math.floor(absDiff / (1000 * 60));
  const totalHours = Math.floor(absDiff / (1000 * 60 * 60));
  const totalDays = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  // Approximate months (30.44 days) and years (365.25 days)
  const totalMonths = Math.floor(absDiff / (1000 * 60 * 60 * 24 * 30.44));
  const totalYears = Math.floor(absDiff / (1000 * 60 * 60 * 24 * 365.25));

  switch (unit) {
    case "years": return totalYears;
    case "months": return totalMonths;
    case "days": return totalDays;
    case "hours": return totalHours;
    case "minutes": return totalMinutes;
    case "seconds": return totalSeconds;
    default: return null;
  }
}

function getUnitLabel(unit) {
  const labels = {
    years: "Years",
    months: "Months",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds"
  };
  return labels[unit] || "";
}

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
    const unit = event.unit || "default";
    const displayValue = unit === "default" ? null : getDisplayValue(target - new Date(), unit);
    const unitLabel = getUnitLabel(unit);

    if (remaining.past) {
      return `
        <div class="event-card past-event">
          <div class="event-header">
            <div class="event-name">${escapeHtml(event.name)}</div>
            <div class="event-actions">
              <button class="edit-btn" data-id="${event.id}">Edit</button>
              <button class="delete-btn" data-id="${event.id}">Delete</button>
            </div>
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
          <div class="event-actions">
            <button class="edit-btn" data-id="${event.id}">Edit</button>
            <button class="delete-btn" data-id="${event.id}">Delete</button>
          </div>
        </div>
        <div class="event-datetime">${datetimeStr}</div>
        ${unit === "default" ? (event.time ? `
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
        ` : `
        <div class="countdown days-only">
          <div class="time-unit">
            <span class="time-value">${remaining.days}</span>
            <span class="time-label">Days</span>
          </div>
        </div>
        `) : `
        <div class="countdown days-only">
          <div class="time-unit">
            <span class="time-value">${displayValue}</span>
            <span class="time-label">${unitLabel}</span>
          </div>
        </div>
        `}
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

  // Attach edit listeners
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      startEdit(id);
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
function addEvent(name, date, time, unit) {
  const event = {
    id: Date.now().toString(),
    name: name.trim(),
    date,
    time: time || null,
    unit: unit || "default"
  };
  events.push(event);
  saveEvents();
  renderEvents();
}

// Start editing an event
function startEdit(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  editingId = id;
  nameInput.value = event.name;
  dateInput.value = event.date;
  timeInput.value = event.time || "";
  unitInput.value = event.unit || "default";

  formTitle.textContent = "Edit Event";
  submitBtn.textContent = "Update Event";
  cancelBtn.style.display = "inline-block";
  addEventSection.style.display = "block";
  nameInput.focus();

  // Scroll to form
  document.querySelector(".add-event").scrollIntoView({ behavior: "smooth" });
}

// Update existing event
function updateEvent(id, name, date, time, unit) {
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return;

  events[index] = {
    ...events[index],
    name: name.trim(),
    date,
    time: time || null,
    unit: unit || "default"
  };
  saveEvents();
  renderEvents();
  resetForm();
}

// Reset form to add mode
function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "Add New Event";
  submitBtn.textContent = "Add Event";
  cancelBtn.style.display = "none";
  addEventSection.style.display = "none";
  dateInput.valueAsDate = new Date();
  nameInput.focus();
}

// Delete event
function deleteEvent(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  const confirmed = confirm(`Delete "${event.name}"? This cannot be undone.`);
  if (!confirmed) return;

  events = events.filter(e => e.id !== id);
  if (editingId === id) resetForm();
  saveEvents();
  renderEvents();
}

// Show form to add new event
addBtn.addEventListener("click", () => {
  if (editingId) resetForm();
  addEventSection.style.display = "block";
  cancelBtn.style.display = "inline-block";
  formTitle.textContent = "Add New Event";
  submitBtn.textContent = "Add Event";
  nameInput.focus();
  addEventSection.scrollIntoView({ behavior: "smooth" });
});

// Cancel edit
cancelBtn.addEventListener("click", () => {
  resetForm();
});

// Close form with X
closeBtn.addEventListener("click", () => {
  resetForm();
});

// Form submit handler
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value;
  const date = dateInput.value;
  const time = timeInput.value;
  const unit = unitInput.value;

  if (!name || !date) return;

  if (editingId) {
    updateEvent(editingId, name, date, time, unit);
  } else {
    addEvent(name, date, time, unit);
    resetForm();
  }
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
