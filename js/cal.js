const workerUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/';
const icalUrls = {
    '123': 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=713a99e9483f6ed204d12be2acc1f940',
    '1248': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=20937949370c92092084c8f0e5a50bbb'
};

async function fetchIcalData(icalUrl) {
    const response = await fetch(`${workerUrl}?url=${encodeURIComponent(icalUrl)}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    if (text.trim().startsWith('<')) {
        throw new Error('Received HTML instead of iCal data');
    }
    return text;
}

function parseIcalData(icalData, color) {
    const events = [];
    const reservations = [];
    try {
        const jcalData = ICAL.parse(icalData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        
        vevents.forEach(event => {
            const summary = event.getFirstPropertyValue('summary');
            const startDate = event.getFirstPropertyValue('dtstart').toJSDate();
            const endDate = event.getFirstPropertyValue('dtend').toJSDate();
            events.push({
                title: summary,
                start: startDate,
                end: endDate,
                color: color
            });
            reservations.push({ summary, startDate, endDate });
        });
    } catch (error) {
        console.error('Error parsing iCal data:', error);
        throw error;
    }
    return { events, reservations };
}

function renderCalendar(events) {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: events,
        locale: 'pt',
        eventDisplay: 'block',
    });
    calendar.render();
}

function displayReservations(apartmentId, reservations) {
    const ul = document.getElementById(`reservas${apartmentId}`);
    ul.innerHTML = '';
    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `${reservation.summary}: ${reservation.startDate.toLocaleDateString()} - ${reservation.endDate.toLocaleDateString()}`;
        ul.appendChild(li);
    });
}

async function loadICalData() {
    const allEvents = [];
    try {
        const icalData123 = await fetchIcalData(icalUrls['123']);
        const { events: events123, reservations: reservations123 } = parseIcalData(icalData123, 'blue');
        allEvents.push(...events123);
        displayReservations('123', reservations123);

        const icalData1248 = await fetchIcalData(icalUrls['1248']);
        const { events: events1248, reservations: reservations1248 } = parseIcalData(icalData1248, 'orange');
        allEvents.push(...events1248);
        displayReservations('1248', reservations1248);

        renderCalendar(allEvents);
    } catch (error) {
        console.error("Error loading calendar data", error);
    }
}

document.addEventListener('DOMContentLoaded', loadICalData);
