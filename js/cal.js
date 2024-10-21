const workerUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/';
const icalUrls = {
    '123': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=713a99e9483f6ed204d12be2acc1f940',
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
    });
}

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

function init() {
    document.addEventListener('DOMContentLoaded', () => {
        for (const apartmentId of Object.keys(icalUrls)) {
            loadICalData(apartmentId);
        }
    });
}

init();