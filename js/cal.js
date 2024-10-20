// URL do proxy para contornar CORS
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

// Função para carregar e processar um arquivo iCal
async function loadICalData(url, elementId) {
    try {
        const response = await fetch(proxyUrl + url);
        const icalData = await response.text();
        const events = parseICal(icalData);
        displayEvents(events, elementId);
    } catch (error) {
        console.error("Erro ao carregar o iCal:", error);
    }
}

// Função para parsear o conteúdo do iCal
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

// Função para exibir os eventos extraídos na página
function displayEvents(events, elementId) {
    const listElement = document.getElementById(elementId);
    events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.textContent = `Evento: ${event.summary} | Início: ${event.start} | Fim: ${event.end}`;
        listElement.appendChild(listItem);
    });
}

// Carregar os arquivos iCal dos links fornecidos
loadICalData('https://www.airbnb.pt/calendar/ical/9776121.ics?s=713a99e9483f6ed204d12be2acc1f940', 'apartment123-events');
loadICalData('https://www.airbnb.pt/calendar/ical/1192674.ics?s=20937949370c92092084c8f0e5a50bbb', 'apartment1248-events');
