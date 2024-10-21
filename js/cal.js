// URLs and Configuration
const workerUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/';
const icalUrls = {
    '123': 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=713a99e9483f6ed204d12be2acc1f940',
    '1248': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=20937949370c92092084c8f0e5a50bbb'
};

// Variables to store reservation dates
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

// Function to Display Reservations in Lists
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

        // Add each date in the reservation period to reservedDates set
        let currentDate = new Date(reservation.startDate);
        while (currentDate < reservation.endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            reservedDates.add(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
        }
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
function initReservations() {
    document.addEventListener('DOMContentLoaded', () => {
        for (const apartmentId of Object.keys(icalUrls)) {
            loadICalData(apartmentId);
        }
    });
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
                // Exit the Loop if All Dates are Filled
                cell.innerHTML = '';
            }
            else {
                let span = document.createElement('span');
                span.textContent = date;

                const dateStr = new Date(year, month, date).toISOString().split('T')[0];

                // Highlight Reserved Dates
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
    document.addEventListener('DOMContentLoaded', () => {
        renderCalendar(currentMonth, currentYear);
        setupNavigation();
    });
}

// Initialize Both Reservations and Calendar
function init() {
    initReservations();
    initCalendar();
}

init();
