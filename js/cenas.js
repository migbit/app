// js/cenas.js

// Import Firebase Firestore functions
import { db } from '../js/script.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Import ICAL library (Ensure this is included in your HTML)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/ical.js/1.4.0/ical.min.js"></script>

// Configuration
const CONFIG = {
    workerUrl: 'https://noisy-butterfly-af58.migbit84.workers.dev/',
    icalUrls: {
        '123': 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=713a99e9483f6ed204d12be2acc1f940',
        '1248': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=20937949370c92092084c8f0e5a50bbb'
    },
    months: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
};

// State
const state = {
    reservedDates: new Set(),
    reservedDates123: new Set(),     // For Apartment 123
    reservedDates1248: new Set(),    // For Apartment 1248
    selectedDates: new Set(),        // Track selected dates
    today: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// -------------------- Calendar Functions -------------------- //

/**
 * Fetches iCal data from a given URL via a proxy worker.
 * @param {string} icalUrl - The URL of the iCal file.
 * @returns {Promise<string>} - The raw iCal data as a string.
 */
async function fetchIcalData(icalUrl) {
    try {
        const response = await fetch(`${CONFIG.workerUrl}?url=${encodeURIComponent(icalUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of iCal data');
        }
        return text;
    } catch (error) {
        console.error('Error fetching iCal data:', error);
        throw error;
    }
}

/**
 * Parses raw iCal data into an array of reservation objects.
 * @param {string} icalData - The raw iCal data.
 * @returns {Array<Object>} - An array of reservation objects.
 */
function parseIcalData(icalData) {
    try {
        const jcalData = ICAL.parse(icalData);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents('vevent');

        return events.map(event => ({
            summary: event.getFirstPropertyValue('summary'),
            startDate: event.getFirstPropertyValue('dtstart').toJSDate(),
            endDate: event.getFirstPropertyValue('dtend').toJSDate()
        }));
    } catch (error) {
        console.error('Error parsing iCal data:', error);
        throw error;
    }
}

/**
 * Loads iCal data for a specific apartment and updates the reserved dates.
 * @param {string} apartmentId - The ID of the apartment.
 */
async function loadIcalData(apartmentId) {
    try {
        const icalData = await fetchIcalData(CONFIG.icalUrls[apartmentId]);
        const reservations = parseIcalData(icalData);

        reservations.forEach(reservation => {
            const dateStr = reservation.startDate.toISOString().split('T')[0];
            state.reservedDates.add(dateStr);

            // Store dates per apartment
            if (apartmentId === '123') {
                state.reservedDates123.add(dateStr);
            } else if (apartmentId === '1248') {
                state.reservedDates1248.add(dateStr);
            }
        });
    } catch (error) {
        console.error(`Error loading iCal for Apartment ${apartmentId}:`, error);
    }
}

/**
 * Renders the calendar for a specific month and year.
 * @param {number} month - The month index (0-11).
 * @param {number} year - The full year (e.g., 2024).
 */
function renderCalendar(month, year) {
    const monthYear = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');

    if (!monthYear || !calendarBody) {
        console.error('Required calendar elements not found');
        return;
    }

    // Clear previous content
    calendarBody.innerHTML = '';
    monthYear.textContent = `${CONFIG.months[month]} ${year}`;

    // Calculate calendar data
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let date = 1;

    // Create calendar grid
    for (let i = 0; i < 6; i++) { // 6 weeks to cover all possible month layouts
        const row = document.createElement('tr');

        for (let j = 0; j < 7; j++) { // 7 days a week
            const cell = document.createElement('td');

            if (i === 0 && j < firstDay || date > daysInMonth) {
                cell.innerHTML = '';
            } else {
                const span = document.createElement('span');
                span.textContent = date;

                const dateObj = new Date(year, month, date);
                const dateStr = dateObj.toISOString().split('T')[0];

                // Check if the day is today
                if (date === state.today.getDate() &&
                    month === state.today.getMonth() &&
                    year === state.today.getFullYear()) {
                    span.classList.add('today');
                }

                // Apply reserved style if date is reserved
                if (state.reservedDates.has(dateStr)) {
                    span.classList.add('reserved');
                }

                // Apply selected style if date is selected
                if (state.selectedDates.has(dateStr)) {
                    span.classList.add('selected');
                }

                // Event listener for selecting/unselecting a date
                span.addEventListener('click', async () => {
                    if (span.classList.contains('selected')) {
                        // Unselect the date
                        span.classList.remove('selected');
                        state.selectedDates.delete(dateStr);
                        await removeSelectedDateFromFirebase(dateStr);
                    } else {
                        // Select the date
                        span.classList.add('selected');
                        state.selectedDates.add(dateStr);
                        await saveSelectedDateToFirebase(dateStr);
                    }
                });

                cell.appendChild(span);
                date++;
            }

            row.appendChild(cell);
        }

        calendarBody.appendChild(row);
        if (date > daysInMonth) break; // Stop creating rows if all dates are rendered
    }
}

// -------------------- Firebase Functions for Selected Dates -------------------- //

/**
 * Loads selected dates from Firestore and updates the state.
 */
async function loadSelectedDates() {
    try {
        const q = query(collection(db, "selectedDates"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const dateStr = doc.id; // Assuming the document ID is the date string
            state.selectedDates.add(dateStr);
        });
    } catch (error) {
        console.error("Error loading selected dates:", error);
    }
}

/**
 * Saves a selected date to Firestore.
 * @param {string} dateStr - The date string in 'YYYY-MM-DD' format.
 */
async function saveSelectedDateToFirebase(dateStr) {
    try {
        await setDoc(doc(db, "selectedDates", dateStr), {
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving selected date:", error);
    }
}

/**
 * Removes a selected date from Firestore.
 * @param {string} dateStr - The date string in 'YYYY-MM-DD' format.
 */
async function removeSelectedDateFromFirebase(dateStr) {
    try {
        await deleteDoc(doc(db, "selectedDates", dateStr));
    } catch (error) {
        console.error("Error removing selected date:", error);
    }
}

// -------------------- To-Do List Functions -------------------- //

/**
 * Adds a new task to the Firestore 'tasks' collection.
 * @param {string} taskText - The text of the task.
 */
async function addTask(taskText) {
    try {
        await addDoc(collection(db, "tasks"), {
            text: taskText,
            completed: false,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding task:", error);
        throw error;
    }
}

/**
 * Loads tasks from Firestore and displays them in the DOM.
 */
async function loadTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) {
        console.error('Task list element not found');
        return;
    }

    taskList.innerHTML = '<li>Carregando tarefas...</li>';

    try {
        const q = query(collection(db, "tasks"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);

        taskList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const task = doc.data();
            addTaskToDOM(doc.id, task);
        });
    } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
        taskList.innerHTML = '<li>Erro ao carregar tarefas</li>';
    }
}

/**
 * Adds a single task to the DOM.
 * @param {string} id - The Firestore document ID of the task.
 * @param {Object} task - The task data.
 */
function addTaskToDOM(id, task) {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    const li = document.createElement('li');
    li.id = id;

    // Checkbox for task completion
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskCompletion(id, checkbox.checked));

    // Task text
    const span = document.createElement('span');
    span.textContent = task.text;
    if (task.completed) {
        span.classList.add('completed');
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Apagar';
    deleteBtn.addEventListener('click', () => deleteTask(id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
}

/**
 * Toggles the completion status of a task in Firestore.
 * @param {string} taskId - The Firestore document ID of the task.
 * @param {boolean} isCompleted - The new completion status.
 */
async function toggleTaskCompletion(taskId, isCompleted) {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await setDoc(taskRef, { completed: isCompleted }, { merge: true });
        const taskElement = document.getElementById(taskId);
        if (taskElement) {
            const span = taskElement.querySelector('span');
            if (isCompleted) {
                span.classList.add('completed');
            } else {
                span.classList.remove('completed');
            }
        }
    } catch (error) {
        console.error("Error updating task completion:", error);
    }
}

/**
 * Deletes a task from Firestore and removes it from the DOM.
 * @param {string} taskId - The Firestore document ID of the task.
 */
async function deleteTask(taskId) {
    try {
        await deleteDoc(doc(db, "tasks", taskId));
        const taskElement = document.getElementById(taskId);
        if (taskElement) {
            taskElement.remove();
        }
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

// -------------------- Guest List Functions -------------------- //

/**
 * Determines the apartment based on the check-in date.
 * @param {string} checkInDate - The check-in date in 'YYYY-MM-DD' format.
 * @returns {string|null} - The apartment ID or null if not found.
 */
function determineApartmentByDate(checkInDate) {
    if (state.reservedDates123.has(checkInDate)) {
        return '123';
    } else if (state.reservedDates1248.has(checkInDate)) {
        return '1248';
    } else {
        return null;
    }
}

/**
 * Adds a new guest to the Firestore 'guestList' collection.
 * @param {Object} guestData - The guest data.
 * @returns {Promise<string>} - The Firestore document ID of the new guest.
 */
async function addGuest(guestData) {
    try {
        const docRef = await addDoc(collection(db, "guestList"), guestData);
        console.log("Guest added with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding guest:", error);
        throw error;
    }
}

/**
 * Loads the guest list from Firestore and displays it in the DOM.
 */
async function loadGuestList() {
    const guestList = document.getElementById('guest-list');
    if (!guestList) {
        console.error('Guest list element not found');
        return;
    }

    guestList.innerHTML = '<li>Carregando lista de hóspedes...</li>';

    try {
        const q = query(collection(db, "guestList"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);

        guestList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const guest = doc.data();
            addGuestToDOM(doc.id, guest);
        });
    } catch (error) {
        console.error("Erro ao carregar lista de hóspedes:", error);
        guestList.innerHTML = '<li>Erro ao carregar lista de hóspedes</li>';
    }
}

/**
 * Adds a single guest to the DOM.
 * @param {string} id - The Firestore document ID of the guest.
 * @param {Object} guest - The guest data.
 */
function addGuestToDOM(id, guest) {
    const guestList = document.getElementById('guest-list');
    if (!guestList) return;

    const li = document.createElement('li');
    li.id = id;

    li.innerHTML = `
        <strong>Apartamento:</strong> ${guest.apartment} |
        <strong>Entrada:</strong> ${guest.checkInDate} |
        <strong>Nome:</strong> ${guest.nome} |
        <strong>Vão deixar 5 estrelas?</strong> ${guest.estrelas} |
        <strong>Escrever comentário?</strong> ${guest.comentario}
        <button class="delete-btn">Apagar</button>
    `;

    // Attach event listener to the delete button
    const deleteBtn = li.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteGuest(id));
    }

    guestList.appendChild(li);
}

/**
 * Deletes a guest from Firestore and removes them from the DOM.
 * @param {string} guestId - The Firestore document ID of the guest.
 */
async function deleteGuest(guestId) {
    try {
        await deleteDoc(doc(db, "guestList", guestId));
        const guestElement = document.getElementById(guestId);
        if (guestElement) {
            guestElement.remove();
        }
    } catch (error) {
        console.error("Error deleting guest:", error);
    }
}

// -------------------- Event Listeners -------------------- //

/**
 * Sets up all necessary event listeners for the application.
 */
function setupEventListeners() {
    // Calendar navigation
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            state.currentMonth--;
            if (state.currentMonth < 0) {
                state.currentMonth = 11;
                state.currentYear--;
            }
            renderCalendar(state.currentMonth, state.currentYear);
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            state.currentMonth++;
            if (state.currentMonth > 11) {
                state.currentMonth = 0;
                state.currentYear++;
            }
            renderCalendar(state.currentMonth, state.currentYear);
        });
    }

    // To-Do form submission
    const todoForm = document.getElementById('todo-form');
    if (todoForm) {
        todoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('todo-input');
            if (!input) return;

            const taskText = input.value.trim();
            if (!taskText) {
                alert('Por favor, insira uma tarefa válida');
                return;
            }

            try {
                await addTask(taskText);
                input.value = '';
                await loadTasks();
            } catch (error) {
                alert('Erro ao adicionar tarefa');
            }
        });
    }

    // Guest form submission
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const estrelas = document.getElementById('estrelas').value.trim();
            const comentario = document.getElementById('comentario').value.trim();
            const checkInDate = document.getElementById('check-in-date').value;

            if (!nome || !estrelas || !comentario || !checkInDate) {
                alert('Por favor, preencha todos os campos do formulário');
                return;
            }

            const apartment = determineApartmentByDate(checkInDate);

            if (!apartment) {
                alert('Data não pertence a nenhum apartamento');
                return;
            }

            const guestData = {
                nome: nome,
                estrelas: estrelas,
                comentario: comentario,
                checkInDate: checkInDate,
                apartment: apartment,
                timestamp: serverTimestamp()
            };

            try {
                const guestId = await addGuest(guestData);
                addGuestToDOM(guestId, guestData);
            } catch (error) {
                alert('Erro ao adicionar hóspede');
            }

            guestForm.reset();
        });
    }
}

// -------------------- Initialization -------------------- //

/**
 * Initializes the application by loading data and setting up the UI.
 */
async function init() {
    try {
        // Load reservations
        await Promise.all([
            loadIcalData('123'),
            loadIcalData('1248')
        ]);

        // Load selected dates
        await loadSelectedDates();

        // Initialize calendar
        renderCalendar(state.currentMonth, state.currentYear);

        // Load tasks
        await loadTasks();

        // Load guest list
        await loadGuestList();

        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Erro ao inicializar a aplicação');
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
