let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation span");

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const workerUrl = 'https://noisy-butterfly-af58.migbit84.workers.dev/';
const icalUrls = {
    '123': 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=713a99e9483f6ed204d12be2acc1f940',
    '1248': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=20937949370c92092084c8f0e5a50bbb'
};

// Fetch and parse iCal data
async function fetchIcalData(icalUrl) {
    const response = await fetch(`${workerUrl}?url=${encodeURIComponent(icalUrl)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    if (text.trim().startsWith('<')) throw new Error('Received HTML instead of iCal data');
    return text;
}

function parseIcalData(icalData) {
    const events = [];
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    vevents.forEach(event => {
        const summary = event.getFirstPropertyValue('summary');
        const startDate = event.getFirstPropertyValue('dtstart').toJSDate();
        const endDate = event.getFirstPropertyValue('dtend').toJSDate();
        events.push({ summary, startDate, endDate });
    });

    return events;
}

// Display reservations
function displayReservations(apartmentId, reservations) {
    const ul = document.getElementById(`reservas${apartmentId}`);
    ul.innerHTML = '';
    reservations.forEach(reservation => {
        const li = document.createElement('li');
        li.textContent = `${reservation.summary}: ${reservation.startDate.toLocaleDateString()} - ${reservation.endDate.toLocaleDateString()}`;
        ul.appendChild(li);
    });
}

// Calendar manipulation function
const manipulate = () => {
    let dayone = new Date(year, month, 1).getDay();
    let lastdate = new Date(year, month + 1, 0).getDate();
    let dayend = new Date(year, month, lastdate).getDay();
    let monthlastdate = new Date(year, month, 0).getDate();
    let lit = "";

    for (let i = dayone; i > 0; i--) lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    for (let i = 1; i <= lastdate; i++) {
        let isToday = i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? "active" : "";
        lit += `<li class="${isToday}">${i}</li>`;
    }
    for (let i = dayend; i < 6; i++) lit += `<li class="inactive">${i - dayend + 1}</li>`;
    currdate.innerText = `${months[month]} ${year}`;
    day.innerHTML = lit;
}

// Attach event listeners
prenexIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;
        if (month < 0 || month > 11) {
            date = new Date(year, month, new Date().getDate());
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }
        manipulate();
    });
});

manipulate();

// Fetch and display iCal data
async function loadICalData() {
    try {
        const icalData123 = await fetchIcalData(icalUrls['123']);
        const events123 = parseIcalData(icalData123);
        displayReservations('123', events123);

        const icalData1248 = await fetchIcalData(icalUrls['1248']);
        const events1248 = parseIcalData(icalData1248);
        displayReservations('1248', events1248);
    } catch (error) {
        console.error("Error loading calendar data", error);
    }
}

document.addEventListener('DOMContentLoaded', loadICalData);
