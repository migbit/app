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
    const form = document.getElementById('compras-form');
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
}

// Helper functions for creating UI elements
function criarItemCompra(item) {
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
    return itemDiv;
}

function criarItemCompraEmBranco() {
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
    });

    return itemDiv;
}

// Save shopping list to Firebase
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.classList.contains('item-nome-custom') 
                     ? item.getAttribute('data-nome-custom') || nomeElement.value.trim()
                     : nomeElement.textContent.trim();
        const quantidade = parseInt(item.querySelector('.item-quantidade').value, 10);
        const local = item.getAttribute('data-local') || 'Não definido';

        if (nome && quantidade > 0) listaParaSalvar[nome] = { quantidade, local };
    });

    try {
        await setDoc(doc(db, "listas_compras", "lista_atual"), {
            itens: listaParaSalvar,
            ultimaAtualizacao: Timestamp.now()
        });
    } catch (e) {
        console.error("Erro ao salvar a lista de compras: ", e);
        alert('Ocorreu um erro ao salvar a lista de compras.');
    }
}

// Generate shopping list summary
function gerarResumo() {
    const itens = document.querySelectorAll('.item-compra');
    let resumo = '';

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.classList.contains('item-nome-custom')
                     ? item.getAttribute('data-nome-custom') || nomeElement.value.trim()
                     : nomeElement.textContent.trim();
        const quantidade = item.querySelector('.item-quantidade').value;
        const local = item.getAttribute('data-local');

        if (nome && parseInt(quantidade, 10) > 0) {
            let localDisplay = local === 'C' ? ' (Casa)' : '';
            resumo += `${nome}: ${quantidade}${localDisplay}\n`;
        }
    });

    return resumo;
}

// Send shopping list by email using EmailJS
function enviarEmailListaCompras(resumo) {
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS não está definido.');
        alert('Erro ao enviar o e-mail.');
        return;
    }

    emailjs.send('service_tuglp9h', 'template_4micnki', {
        to_name: "apartments.oporto@gmail.com",
        from_name: "Apartments Oporto",
        subject: "Lista de Compras",
        message: resumo
    }).then(response => {
        console.log('E-mail enviado com sucesso!', response.status, response.text);
        alert('E-mail enviado com sucesso!');
    }).catch(error => {
        console.error('Erro ao enviar e-mail:', error);
        alert('Erro ao enviar o e-mail.');
    });
}

// Clear and populate UI from Firebase data
function clearComprasUI() {
    document.getElementById('compras-form').innerHTML = '';
}

function populateComprasUI(itens) {
    criarListaCompras();
    
    document.querySelectorAll('.item-compra').forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.classList.contains('item-nome-custom')
                     ? item.getAttribute('data-nome-custom') || nomeElement.value.trim()
                     : nomeElement.textContent.trim();
        if (itens[nome]) {
            item.querySelector('.item-quantidade').value = itens[nome].quantidade;
            item.setAttribute('data-local', itens[nome].local);
            if (itens[nome].local.includes('C')) item.querySelector('.btn-local-c').classList.add('active');
            item.classList.toggle('item-comprado', itens[nome].quantidade > 0);
        }
    });

    aplicarFiltro(document.getElementById('search-input').value);
}

// Real-time Firebase listener
function monitorListaCompras() {
    const docRef = doc(db, "listas_compras", "lista_atual");
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            clearComprasUI();
            populateComprasUI(docSnap.data().itens);
        } else {
            console.log("Nenhum documento encontrado!");
        }
    });
}

// Update local data for items
function updateLocalData(item) {
    const local = item.getAttribute('data-local') === 'C' ? 'Não definido' : 'C';
    item.setAttribute('data-local', local);
}

// Apply search filter
function aplicarFiltro(filtro) {
    const filtroLower = filtro.toLowerCase();
    document.querySelectorAll('.item-compra').forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent.trim() || item.querySelector('.item-nome-custom')?.value.trim();
        item.style.display = nome.toLowerCase().includes(filtroLower) ? 'flex' : 'none';
    });
}

// Attach event listeners for interactive elements
function attachEventListeners() {
    document.getElementById('compras-form').addEventListener('click', (e) => {
        const item = e.target.closest('.item-compra');
        if (!item) return;

        const input = item.querySelector('.item-quantidade');
        if (e.target.classList.contains('btn-aumentar')) {
            input.value = Math.min(parseInt(input.value, 10) + 1, 99);
            item.classList.toggle('item-comprado', parseInt(input.value, 10) > 0);
            salvarListaCompras();
        } else if (e.target.classList.contains('btn-diminuir')) {
            input.value = Math.max(parseInt(input.value, 10) - 1, 0);
            item.classList.toggle('item-comprado', parseInt(input.value, 10) > 0);
            salvarListaCompras();
        } else if (e.target.classList.contains('btn-zero')) {
            input.value = 0;
            item.classList.remove('item-comprado');
            salvarListaCompras();
        } else if (e.target.classList.contains('btn-local-c')) {
            e.target.classList.toggle('active');
            updateLocalData(item);
            salvarListaCompras();
        }
    });

    // Button listeners for Requisitar and Email
    document.getElementById('btn-requisitar').addEventListener('click', async () => {
        document.getElementById('resumo-conteudo').innerHTML = gerarResumo().replace(/\n/g, '<br>');
        document.getElementById('resumo').style.display = 'block';
        await salvarListaCompras();
    });

    document.getElementById('btn-enviar-email').addEventListener('click', () => enviarEmailListaCompras(gerarResumo()));

    // Search bar listeners
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');

    searchInput.addEventListener('input', (e) => {
        clearSearchBtn.classList.toggle('visible', e.target.value.trim() !== '');
        aplicarFiltro(e.target.value);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        aplicarFiltro('');
    });
}

// Initialize event listeners and UI
document.addEventListener('DOMContentLoaded', () => {
    monitorListaCompras();
    attachEventListeners();
    criarListaCompras();
});
