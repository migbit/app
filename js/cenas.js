// js/cenas.js

import { db } from '../js/script.js';
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
    selectedDates: new Set(), // Track selected dates
    today: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Calendar Functions (unchanged)
async function fetchIcalData(icalUrl) {
    try {
        const response = await fetch(`${CONFIG.workerUrl}?url=${encodeURIComponent(icalUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of iCal data');
        }
        return text;
    } catch (error) {
        console.error('Error fetching iCal data:', error);
        throw error;
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

async function loadIcalData(apartmentId) {
    try {
        const icalData = await fetchIcalData(CONFIG.icalUrls[apartmentId]);
        const reservations = parseIcalData(icalData);
        
        reservations.forEach(reservation => {
            const dateStr = reservation.startDate.toISOString().split('T')[0];
            state.reservedDates.add(dateStr);
        });
    } catch (error) {
        console.error(`Error loading iCal for Apartment ${apartmentId}:`, error);
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

// Firebase functions for saving and removing selected dates (unchanged)
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

// Load selected dates from Firebase on page load (unchanged)
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

// Todo List Functions (unchanged)
async function addTask(taskText) {
    try {
        const docRef = await addDoc(collection(db, "todos"), {
            text: taskText,
            timestamp: new Date()
        });
        console.log("Task added with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding task:", error);
        throw error;
    }
}

async function loadTasks() {
    const todoList = document.getElementById('todo-list');
    if (!todoList) return;

    todoList.innerHTML = '<li>Carregando tarefas...</li>';
    
    try {
        const q = query(collection(db, "todos"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        
        todoList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const task = doc.data();
            const li = document.createElement('li');
            
            const taskText = document.createElement('span');
            taskText.textContent = task.text;
            li.appendChild(taskText);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Apagar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteTask(doc.id);
            li.appendChild(deleteBtn);
            
            todoList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading tasks:", error);
        todoList.innerHTML = '<li>Erro ao carregar tarefas</li>';
    }
}

async function deleteTask(taskId) {
    try {
        await deleteDoc(doc(db, "todos", taskId));
        await loadTasks();
    } catch (error) {
        console.error("Error deleting task:", error);
        alert('Erro ao apagar tarefa');
    }
}

// Cenas dos Comentários Functions (New)
async function addComment(commentText) {
    try {
        const docRef = await addDoc(collection(db, "comments"), {
            text: commentText,
            timestamp: new Date()
        });
        console.log("Comment added with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
}

async function loadComments() {
    const commentList = document.getElementById('comment-list');
    if (!commentList) return;

    commentList.innerHTML = '<li>Carregando comentários...</li>';
    
    try {
        const q = query(collection(db, "comments"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        
        commentList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const comment = doc.data();
            const li = document.createElement('li');
            
            const commentText = document.createElement('span');
            commentText.textContent = comment.text;
            li.appendChild(commentText);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Apagar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteComment(doc.id);
            li.appendChild(deleteBtn);
            
            commentList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
        commentList.innerHTML = '<li>Erro ao carregar comentários</li>';
    }
}

async function deleteComment(commentId) {
    try {
        await deleteDoc(doc(db, "comments", commentId));
        await loadComments();
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert('Erro ao apagar comentário');
    }
}

// Event Listeners (extended to support comments)
function setupEventListeners() {
    document.getElementById('prev-month')?.addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar(state.currentMonth, state.currentYear);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar(state.currentMonth, state.currentYear);
    });

    // Todo form
    document.getElementById('todo-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        if (!input) return;

        const taskText = input.value.trim();
        if (!taskText) {
            alert('Por favor, insira uma tarefa válida');
            return;
        }

        try {
            await addTask(taskText);
            input.value = '';
            await loadTasks();
        } catch (error) {
            alert('Erro ao adicionar tarefa');
        }
    });

    // Comment form (New)
    document.getElementById('comment-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('comment-input');
        if (!input) return;

        const commentText = input.value.trim();
        if (!commentText) {
            alert('Por favor, insira um comentário válido');
            return;
        }

        try {
            await addComment(commentText);
            input.value = '';
            await loadComments();
        } catch (error) {
            alert('Erro ao adicionar comentário');
        }
    });
}

// Initialization (unchanged)
async function init() {
    try {
        // Load reservations
        const loadPromises = Object.keys(CONFIG.icalUrls).map(loadIcalData);
        await Promise.allSettled(loadPromises);

        // Load selected dates
        await loadSelectedDates();

        // Initialize calendar
        renderCalendar(state.currentMonth, state.currentYear);
        
        // Load tasks
        await loadTasks();
        
        // Load comments (New)
        await loadComments();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Erro ao inicializar a aplicação');
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);