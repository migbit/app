const workerUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/';
const icalUrls = {
    apartamento123: 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=713a99e9483f6ed204d12be2acc1f940',
    apartamento1248: 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=20937949370c92092084c8f0e5a50bbb'
};

async function fetchIcalData(icalUrl) {
    const response = await fetch(`${workerUrl}?url=${encodeURIComponent(icalUrl)}`);
    return await response.text();
}

function parseIcalData(icalData) {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent');
    
    return events.map(event => {
        const summary = event.getFirstPropertyValue('summary');
        const startDate = event.getFirstPropertyValue('dtstart').toJSDate();
        const endDate = event.getFirstPropertyValue('dtend').toJSDate();
        return { summary, startDate, endDate };
    });
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

async function init() {
    for (const [apartmentId, icalUrl] of Object.entries(icalUrls)) {
        try {
            const icalData = await fetchIcalData(icalUrl);
            const reservations = parseIcalData(icalData);
            displayReservations(apartmentId, reservations);
        } catch (error) {
            console.error(`Erro ao buscar dados para ${apartmentId}:`, error);
        }
    }
}

init();