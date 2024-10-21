// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    const monthYear = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    // Initialize date variables
    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    // Array of month names
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July','August','September','October','November','December'
    ];

    // Function to render the calendar
    function renderCalendar(month, year) {
        // Clear previous cells
        calendarBody.innerHTML = '';

        // Set month and year in header
        monthYear.textContent = `${months[month]} ${year}`;

        // First day of the month (0 = Sunday, 6 = Saturday)
        let firstDay = new Date(year, month, 1).getDay();

        // Number of days in the month
        let daysInMonth = new Date(year, month + 1, 0).getDate();

        let date = 1;

        // Create 6 rows for the calendar (to cover all possible weeks)
        for (let i = 0; i < 6; i++) {
            let row = document.createElement('tr');

            // Create 7 columns for each day of the week
            for (let j = 0; j < 7; j++) {
                let cell = document.createElement('td');

                // Fill in the blanks for days before the first day of the month
                if (i === 0 && j < firstDay) {
                    cell.innerHTML = '';
                }
                // Fill in the days of the month
                else if (date > daysInMonth) {
                    break; // Exit the loop if all dates are filled
                }
                else {
                    // Create a span to style the date
                    let span = document.createElement('span');
                    span.textContent = date;

                    // Highlight today's date
                    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        span.classList.add('today');
                    }

                    cell.appendChild(span);
                    date++;
                }

                row.appendChild(cell);
            }

            calendarBody.appendChild(row);

            // Stop creating rows if all dates are rendered
            if (date > daysInMonth) {
                break;
            }
        }
    }

    // Event listeners for navigation buttons
    prevBtn.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextBtn.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    // Initial render
    renderCalendar(currentMonth, currentYear);
});
