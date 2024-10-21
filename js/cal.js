const currentMonth = document.getElementById('currentMonth');
const calendarDays = document.getElementById('calendarDays');
let date = new Date();

function renderCalendar() {
    const currentYear = date.getFullYear();
    const currentMonthIndex = date.getMonth();
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

    const firstDayIndex = new Date(currentYear, currentMonthIndex, 1).getDay();

    currentMonth.innerText = `${date.toLocaleString('default', { month: 'long' })} ${currentYear}`;
    calendarDays.innerHTML = '';

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('span');
        emptyDay.classList.add('empty');
        calendarDays.appendChild(emptyDay);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('span');
        day.innerText = i;
        calendarDays.appendChild(day);
    }
}

document.getElementById('btnPrev').addEventListener('click', () => {
    date.setMonth(date.getMonth() - 1);
    renderCalendar();
});

document.getElementById('btnNext').addEventListener('click', () => {
    date.setMonth(date.getMonth() + 1);
    renderCalendar();
});

renderCalendar();
