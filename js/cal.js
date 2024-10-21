// js/cal.js

// Import necessary Firebase functions from script.js and Firebase SDK
import { db } from './script.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// URLs and Configuration for Calendar
const workerUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/';
const icalUrls = {
    '123': 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=713a99e9483f6ed204d12be2acc1f940',
    '1248': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=20937949370c92092084c8f0e5a50bbb'
};

// Variables to store reservation start dates
let reservedDates = new Set();

// Function to Fetch iCal Data through Proxy
async function fetchIcalData(icalUrl) {
    try {
        const response = await fetch(`${workerUrl}?url=${encodeURIComponent(icalUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of iCal data');
        }
        return text;
    } catch (error) {
        throw error;
    }
}

// Function to Parse iCal Data
function parseIcalData(icalData) {
    try {
        const jcalData = ICAL.parse(icalData);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents('vevent');

        return events.map(event => {
            const summary = event.getFirstPropertyValue('summary');
            const startDate = event.getFirstPropertyValue('dtstart').toJSDate();
            const endDate = event.getFirstPropertyValue('dtend').toJSDate();
            return { summary, startDate, endDate };
        });
    } catch (error) {
        console.error('Error parsing iCal data:', error);
        console.log('Raw iCal data:', icalData);
        throw error;
    }
}

// Function to Display Reservations in Lists and Collect Start Dates
function displayReservations(apartmentId, reservations) {
    const ul = document.getElementById(`reservas${apartmentId}`);
    if (!ul) {
        console.error(`Element with id 'reservas${apartmentId}' not found`);
        return;
    }
    ul.innerHTML = '';
    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `${reservation.summary}: ${reservation.startDate.toLocaleDateString()} - ${reservation.endDate.toLocaleDateString()}`;
        ul.appendChild(li);

        // Add only the start date of the reservation to reservedDates set
        const dateStr = reservation.startDate.toISOString().split('T')[0];
        reservedDates.add(dateStr);
    });
}

// Function to Load iCal Data for an Apartment
async function loadICalData(apartmentId) {
    try {
        const icalData = await fetchIcalData(icalUrls[apartmentId]);
        console.log(`Raw iCal data for Apartment ${apartmentId}:`, icalData);
        const reservations = parseIcalData(icalData);
        displayReservations(apartmentId, reservations);
    } catch (error) {
        console.error(`Error loading iCal for Apartment ${apartmentId}:`, error);
        const errorElement = document.getElementById(`reservas${apartmentId}`);
        if (errorElement) {
            errorElement.innerHTML = `<li class="error">Erro ao carregar dados para Apartamento ${apartmentId}: ${error.message}</li>`;
        }
    }
}

// Function to Initialize Reservation Loading
async function initReservations() {
    const promises = [];
    for (const apartmentId of Object.keys(icalUrls)) {
        promises.push(loadICalData(apartmentId));
    }
    await Promise.all(promises);
}

// Calendar Variables
let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Array of Month Names
const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

// Function to Render the Calendar
function renderCalendar(month, year) {
    const monthYear = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    calendarBody.innerHTML = '';

    // Set Month and Year in Header
    monthYear.textContent = `${months[month]} ${year}`;

    // First Day of the Month (0 = Sunday, 6 = Saturday)
    let firstDay = new Date(year, month, 1).getDay();

    // Number of Days in the Month
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    let date = 1;

    // Create 6 Rows for the Calendar (to cover all possible weeks)
    for (let i = 0; i < 6; i++) {
        let row = document.createElement('tr');

        // Create 7 Columns for Each Day of the Week
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement('td');

            if (i === 0 && j < firstDay) {
                // Empty Cell Before First Day of the Month
                cell.innerHTML = '';
            }
            else if (date > daysInMonth) {
                // Empty Cell After Last Day of the Month
                cell.innerHTML = '';
            }
            else {
                let span = document.createElement('span');
                span.textContent = date;

                const dateObj = new Date(year, month, date);
                const dateStr = dateObj.toISOString().split('T')[0];

                // Highlight Reserved Dates (Only Start Dates)
                if (reservedDates.has(dateStr)) {
                    span.classList.add('reserved');
                }

                // Highlight Today's Date
                if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    span.classList.add('today');
                }

                cell.appendChild(span);
                date++;
            }

            row.appendChild(cell);
        }

        calendarBody.appendChild(row);

        // Stop Creating Rows if All Dates are Rendered
        if (date > daysInMonth) {
            break;
        }
    }
}

// Function to Handle Navigation
function setupNavigation() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });
}

// Function to Initialize Calendar
function initCalendar() {
    renderCalendar(currentMonth, currentYear);
    setupNavigation();
}

// ======================
// To-Do List Functionality
// ======================

// Select DOM elements for To-Do list
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Function to add a new task to Firestore
async function addTask(taskText) {
    try {
        const docRef = await addDoc(collection(db, "todos"), {
            text: taskText,
            timestamp: new Date(),
            userId: auth.currentUser ? auth.currentUser.uid : null
        });
        console.log("Task added with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding task: ", e);
    }
}

// Function to load tasks from Firestore
async function loadTasks() {
    todoList.innerHTML = '<li>Carregando tarefas...</li>';
    try {
        const q = query(collection(db, "todos"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        todoList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const task = doc.data();
            const li = document.createElement('li');
            li.textContent = task.text;
            li.setAttribute('data-id', doc.id);

            // Create a delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Apagar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(doc.id));

            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    } catch (e) {
        console.error("Error loading tasks: ", e);
        todoList.innerHTML = '<li>Ocorreu um erro ao carregar as tarefas.</li>';
    }
}

// Function to delete a task from Firestore
async function deleteTask(taskId) {
    try {
        await deleteDoc(doc(db, "todos", taskId));
        console.log("Task deleted with ID: ", taskId);
        loadTasks(); // Reload tasks after deletion
    } catch (e) {
        console.error("Error deleting task: ", e);
    }
}

// Event listener for adding a new task
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskText = todoInput.value.trim();
    if (taskText === '') {
        alert('Por favor, insira uma tarefa válida.');
        return;
    }
    await addTask(taskText);
    todoInput.value = '';
    loadTasks();
});

// ======================
// Initialize All Functionality
// ======================

function init() {
    initReservations();
    initCalendar();
}

init();
