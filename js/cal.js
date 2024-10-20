// Base URL of the Worker Cloudflare
const workerProxyUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/?url=';

// Function to load and display events
async function loadICalData(url, elementId) {
    try {
        const response = await fetch(workerProxyUrl + url);
        const icalData = await response.text();
        const events = parseICal(icalData);
        displayEvents(events, elementId);
    } catch (error) {
        console.error("Error loading iCal:", error);
    }
}

// Function to parse the iCal data
function parseICal(icalData) {
    const events = [];
    const lines = icalData.split('\n');
    let event = null;

    lines.forEach(line => {
        if (line.startsWith('BEGIN:VEVENT')) {
            event = {};
        } else if (line.startsWith('END:VEVENT')) {
            events.push(event);
            event = null;
        } else if (event) {
            if (line.startsWith('DTSTART')) {
                event.start = line.split(':')[1];
            } else if (line.startsWith('DTEND')) {
                event.end = line.split(':')[1];
            } else if (line.startsWith('SUMMARY')) {
                event.summary = line.split(':')[1];
            }
        }
    });

    return events;
}

// Function to display events in the HTML
function displayEvents(events, elementId) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';  // Clear the previous content

    events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.textContent = `Evento: ${event.summary} | Início: ${event.start} | Fim: ${event.end}`;
        listElement.appendChild(listItem);
    });
}

// Load the iCal data for Apartment 123 and Apartment 1248
loadICalData('https://www.airbnb.pt/calendar/ical/9776121.ics?s=713a99e9483f6ed204d12be2acc1f940', 'apartment123-events');
loadICalData('https://www.airbnb.pt/calendar/ical/1192674.ics?s=20937949370c92092084c8f0e5a50bbb', 'apartment1248-events');
