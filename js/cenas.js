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

// Calendar Functions (No changes here)

// Guest List Functions
async function addGuest(guestData) {
    try {
        const docRef = await addDoc(collection(db, "guestList"), guestData);
        console.log("Guest added with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding guest:", error);
        throw error;
    }
}

async function loadGuestList() {
    const guestList = document.getElementById('guest-list');
    guestList.innerHTML = '<li>Loading guests...</li>';
    
    try {
        const q = query(collection(db, "guestList"), orderBy("checkInDate", "asc"));
        const querySnapshot = await getDocs(q);
        
        guestList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const guest = doc.data();
            addGuestToDOM(doc.id, guest);
        });
    } catch (error) {
        console.error("Error loading guest list:", error);
        guestList.innerHTML = '<li>Error loading guests</li>';
    }
}

async function deleteGuest(guestId) {
    try {
        await deleteDoc(doc(db, "guestList", guestId));
        document.getElementById(guestId).remove();
    } catch (error) {
        console.error("Error deleting guest:", error);
    }
}

function addGuestToDOM(id, guest) {
    const guestList = document.getElementById('guest-list');
    const li = document.createElement('li');
    li.id = id;

    li.innerHTML = `
        Apartamento: ${guest.apartment} | Entrada: ${guest.checkInDate} | Nome: ${guest.name} |
        Vão deixar 5 estrelas? ${guest.stars} | Escrever comentário? ${guest.comment}
        <button class="delete-btn" onclick="deleteGuest('${id}')">Apagar</button>
    `;

    guestList.appendChild(li);
}

// Event Listeners for Guest Form
function setupGuestListEventListeners() {
    document.getElementById('guest-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('guest-name').value;
        const stars = document.getElementById('guest-stars').value;
        const comment = document.getElementById('guest-comment').value;
        const checkInDate = document.getElementById('guest-date').value;
        const apartment = determineApartmentByDate(checkInDate); // You can create this function based on the date

        const guestData = {
            name: name,
            stars: stars,
            comment: comment,
            checkInDate: checkInDate,
            apartment: apartment
        };

        try {
            const guestId = await addGuest(guestData);
            addGuestToDOM(guestId, guestData);
        } catch (error) {
            alert('Error adding guest');
        }

        document.getElementById('guest-form').reset();
    });
}

// Initialization
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

        // Load guest list
        await loadGuestList();
        
        // Setup event listeners
        setupEventListeners();
        setupGuestListEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing the app');
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
