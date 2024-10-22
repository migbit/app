// js/cenas.js

import { db } from '../js/script.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
    reservedDates123: new Set(),     // Added
    reservedDates1248: new Set(),    // Added
    selectedDates: new Set(),        // Track selected dates
    today: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Calendar Functions (Unchanged)
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

// Modified loadIcalData to store dates per apartment
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

function renderCalendar(month, year) {
    // Unchanged code
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
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
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
        if (date > daysInMonth) break;
    }
}

// Firebase functions for selected dates (Unchanged)
// ... saveSelectedDateToFirebase(), removeSelectedDateFromFirebase(), loadSelectedDates()

// Todo List Functions (Unchanged)
// ... addTask(), loadTasks(), deleteTask()

// Guest List Functions
function determineApartmentByDate(checkInDate) {
    if (state.reservedDates123.has(checkInDate)) {
        return '123';
    } else if (state.reservedDates1248.has(checkInDate)) {
        return '1248';
    } else {
        return null;
    }
}

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

async function loadGuestList() {
    const guestList = document.getElementById('guest-list');
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

function addGuestToDOM(id, guest) {
    const guestList = document.getElementById('guest-list');
    const li = document.createElement('li');
    li.id = id;

    li.innerHTML = `
        Apartamento: ${guest.apartment} | Entrada: ${guest.checkInDate} | Nome: ${guest.nome} |
        Vão deixar 5 estrelas? ${guest.estrelas} | Escrever comentário? ${guest.comentario}
        <button class="delete-btn" onclick="deleteGuest('${id}')">Apagar</button>
    `;

    guestList.appendChild(li);
}

async function deleteGuest(guestId) {
    try {
        await deleteDoc(doc(db, "guestList", guestId));
        document.getElementById(guestId).remove();
    } catch (error) {
        console.error("Error deleting guest:", error);
    }
}

// Event Listeners (Modified to include guest form listener)
function setupEventListeners() {
    // Calendar navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar(state.currentMonth, state.currentYear);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar(state.currentMonth, state.currentYear);
    });

    // Todo form
    document.getElementById('todo-form')?.addEventListener('submit', async (e) => {
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

    // Guest form
    document.getElementById('guest-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const estrelas = document.getElementById('estrelas').value;
        const comentario = document.getElementById('comentario').value;
        const checkInDate = document.getElementById('check-in-date').value;

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
            timestamp: new Date()
        };

        try {
            const guestId = await addGuest(guestData);
            addGuestToDOM(guestId, guestData);
        } catch (error) {
            alert('Erro ao adicionar hóspede');
        }

        document.getElementById('guest-form').reset();
    });
}

// Initialization (Modified to include loadGuestList)
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
