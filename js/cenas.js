import { db } from './script.js';
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
    reservedDates123: new Set(),
    reservedDates1248: new Set(),
    selectedDates: new Set(), // Track selected dates
    today: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Calendar Functions
async function fetchIcalData(icalUrl, apartmentId) {
    try {
        const response = await fetch(`${CONFIG.workerUrl}?url=${encodeURIComponent(icalUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of iCal data');
        }
        const reservations = parseIcalData(text);
        
        reservations.forEach(reservation => {
            const dateStr = reservation.startDate.toISOString().split('T')[0];
            state.reservedDates.add(dateStr);  // Add date to global set
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

// Firebase functions for saving and removing selected dates
async function saveSelectedDateToFirebase(dateStr) {
    try {
        await addDoc(collection(db, "selectedDates"), { date: dateStr });
        console.log(`Selected date ${dateStr} saved to Firebase`);
    } catch (error) {
        console.error("Error saving selected date:", error);
    }
}

async function removeSelectedDateFromFirebase(dateStr) {
    try {
        const q = query(collection(db, "selectedDates"), where("date", "==", dateStr));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
            console.log(`Unselected date ${dateStr} removed from Firebase`);
        });
    } catch (error) {
        console.error("Error removing selected date:", error);
    }
}

// Load selected dates from Firebase on page load
async function loadSelectedDates() {
    try {
        const querySnapshot = await getDocs(collection(db, "selectedDates"));
        querySnapshot.forEach((doc) => {
            const dateStr = doc.data().date;
            state.selectedDates.add(dateStr);
        });
        console.log("Selected dates loaded from Firebase");
    } catch (error) {
        console.error("Error loading selected dates:", error);
    }
}

// Load guest list from Firebase
async function loadGuestList() {
    const guestList = document.getElementById('guest-list');
    guestList.innerHTML = 'Carregando...';  // Loading indicator

    try {
        const q = query(collection(db, "guestList"), orderBy("timestamp", "asc"));  // Ensure it's ordered by timestamp or any other field
        const querySnapshot = await getDocs(q);

        guestList.innerHTML = '';  // Clear loading text

        querySnapshot.forEach((doc) => {
            const guest = doc.data();
            addGuestToDOM(doc.id, guest);  // Add each guest to the DOM
        });
    } catch (error) {
        console.error("Erro ao carregar lista de hóspedes:", error);
        guestList.innerHTML = 'Erro ao carregar lista de hóspedes';  // Show error message
    }
}

// Add guest entry to the DOM
function addGuestToDOM(id, guest) {
    const guestList = document.getElementById('guest-list');
    const li = document.createElement('li');
    li.id = id;

    li.innerHTML = `
        Apartamento: ${guest.apartamento} | Nome: ${guest.nome} |
        Vão deixar 5 estrelas? ${guest.estrelas} | Escrever comentário? ${guest.comentario}
        <button class="delete-guest-btn" onclick="deleteGuest('${id}')">Apagar</button>
    `;

    guestList.appendChild(li);
}

// Delete guest entry
async function deleteGuest(id) {
    try {
        await deleteGuestFromFirebase(id);
        document.getElementById(id).remove();
    } catch (error) {
        console.error("Erro ao apagar hóspede:", error);
    }
}

// Setup event listeners
function setupEventListeners() {
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const guestForm = document.getElementById('guest-form');

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

    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const estrelas = document.getElementById('estrelas').value;
            const comentario = document.getElementById('comentario').value;

            const apartamento = determineApartmentByDate(state.today.toISOString().split('T')[0]); 

            if (!apartamento) {
                alert('Data não pertence a nenhum apartamento');
                return;
            }

            const guestData = {
                apartamento: apartamento,
                nome: nome,
                estrelas: estrelas,
                comentario: comentario
            };

            try {
                const guestId = await addGuestToFirebase(guestData);
                addGuestToDOM(guestId, guestData);
            } catch (error) {
                alert('Erro ao adicionar hóspede');
            }

            guestForm.reset();
        });
    }
}

async function init() {
    try {
        await fetchIcalData(CONFIG.icalUrls['123'], '123');
        await fetchIcalData(CONFIG.icalUrls['1248'], '1248');
        await loadSelectedDates();
        renderCalendar(state.currentMonth, state.currentYear);
        await loadGuestList();
        setupEventListeners();
    } catch (error) {
        console.error('Erro ao inicializar a aplicação:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);
