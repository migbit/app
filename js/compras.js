// Import Firebase modules
import { db } from './script.js';
import { doc, setDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Define shopping list structure
const listaCompras = {
    "Produtos Limpeza": ["Lixívia tradicional", "Multiusos com Lixívia", "Gel com Lixívia", "CIF", "Limpeza Chão (Lava Tudo)", "Limpeza Chão (Madeira)", "Limpa Vidros", "Limpeza Potente", "Limpeza Placas", "Vinagre"],
    "Roupa": ["Detergente Roupa", "Amaciador", "Lixívia Roupa Branca", "Tira Nódoas", "Tira Gorduras", "Oxi Active", "Branqueador", "Perfumador"],
    "WC": ["Papel Higiénico", "Gel WC Sanitas", "Toalhitas", "Toalhitas Desmaquilhantes", "Blocos Sanitários", "Anticalcário", "Limpeza Chuveiro", "Desentupidor de Canos", "Manutenção Canos", "Papel Higiénico Húmido", "Sabonete Líquido"],
    "Cozinha": ["Água 1.5l", "Água 5l", "Café", "Rolo de Cozinha", "Guardanapos", "Bolachas", "Chá", "Lava-Loiça", "Esfregões Verdes", "Esfregões Bravo", "Película Transparente", "Papel Alumínio", "Sacos congelação"],
    "Diversos": ["Varetas Difusoras (Ambientador)", "Toalhitas Óculos"]
};

// Initialize shopping list UI
function criarListaCompras() {
    console.log("Creating shopping list UI...");
    const form = document.getElementById('compras-form');
    if (!form) {
        console.error("Form element with ID 'compras-form' not found!");
        return;
    }

    Object.entries(listaCompras).forEach(([categoria, itens]) => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria';
        categoriaDiv.innerHTML = `<h3>${categoria}</h3>`;
        
        itens.forEach(item => categoriaDiv.appendChild(criarItemCompra(item)));
        form.appendChild(categoriaDiv);
    });

    const adicionaisDiv = document.createElement('div');
    adicionaisDiv.className = 'categoria';
    adicionaisDiv.innerHTML = '<h3>Itens Adicionais</h3>';
    for (let i = 0; i < 5; i++) adicionaisDiv.appendChild(criarItemCompraEmBranco());
    form.appendChild(adicionaisDiv);
    console.log("Shopping list UI created.");
}

// Helper functions for creating UI elements
function criarItemCompra(item) {
    console.log(`Creating item UI for ${item}...`);
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <span class="item-nome">${item}</span>
            <input type="number" class="item-quantidade" value="0" min="0" max="99" readonly />
        </div>
        <div class="item-controles">
            <button type="button" class="btn-aumentar" aria-label="Aumentar quantidade">+</button>
            <button type="button" class="btn-diminuir" aria-label="Diminuir quantidade">-</button>
            <button type="button" class="btn-zero" aria-label="Zerar quantidade">0</button>
            <button type="button" class="btn-local-c" aria-label="Marcar como Casa">C</button>
        </div>
    `;
    console.log(`Item UI for ${item} created.`);
    return itemDiv;
}

function criarItemCompraEmBranco() {
    console.log("Creating blank item UI...");
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <input type="text" class="item-nome-custom" placeholder="Novo item">
            <input type="number" class="item-quantidade" value="0" min="0" max="99" readonly />
        </div>
        <div class="item-controles">
            <button type="button" class="btn-aumentar" aria-label="Aumentar quantidade">+</button>
            <button type="button" class="btn-diminuir" aria-label="Diminuir quantidade">-</button>
            <button type="button" class="btn-zero" aria-label="Zerar quantidade">0</button>
            <button type="button" class="btn-local-c" aria-label="Marcar como Casa">C</button>
        </div>
    `;

    // Save custom name to data attribute
    const nomeCustomInput = itemDiv.querySelector('.item-nome-custom');
    nomeCustomInput.addEventListener('input', () => {
        itemDiv.setAttribute('data-nome-custom', nomeCustomInput.value.trim());
        console.log("Custom name set:", nomeCustomInput.value.trim());
    });

    console.log("Blank item UI created.");
    return itemDiv;
}

// Save shopping list to Firebase
async function salvarListaCompras() {
    console.log("Saving shopping list to Firebase...");
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.classList.contains('item-nome-custom') 
                     ? item.getAttribute('data-nome-custom') || nomeElement.value.trim()
                     : nomeElement.textContent.trim();
        const quantidade = parseInt(item.querySelector('.item-quantidade').value, 10);
        const local = item.getAttribute('data-local') || 'Não definido';

        if (nome && quantidade > 0) {
            listaParaSalvar[nome] = { quantidade, local };
        }
    });

    try {
        await setDoc(doc(db, "listas_compras", "lista_atual"), {
            itens: listaParaSalvar,
            ultimaAtualizacao: Timestamp.now()
        });
        console.log("Shopping list saved to Firebase successfully.");
    } catch (e) {
        console.error("Error saving shopping list to Firebase:", e);
        alert('Ocorreu um erro ao salvar a lista de compras.');
    }
}

// Initialize event listeners and UI
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded. Initializing...");
    monitorListaCompras();
    attachEventListeners();
    criarListaCompras();
    console.log("Initialization complete.");
});
