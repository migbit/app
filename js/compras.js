// Import Firebase modules
import { db } from './script.js';
import { doc, setDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Define the shopping list structure
const listaCompras = {
    "Produtos Limpeza": [
        "Lixívia tradicional", "Multiusos com Lixívia", "Gel com Lixívia", "CIF",
        "Limpeza Chão (Lava Tudo)", "Limpeza Chão (Madeira)", "Limpa Vidros",
        "Limpeza Potente", "Limpeza Placas", "Vinagre"
    ],
    "Roupa": [
        "Detergente Roupa", "Amaciador", "Lixívia Roupa Branca", "Tira Nódoas",
        "Tira Gorduras", "Oxi Active", "Branqueador", "Perfumador"
    ],
    "WC": [
        "Papel Higiénico", "Gel WC Sanitas", "Toalhitas", "Toalhitas Desmaquilhantes",
        "Blocos Sanitários", "Anticalcário", "Limpeza Chuveiro", "Desentupidor de Canos",
        "Manutenção Canos", "Papel Higiénico Húmido", "Sabonete Líquido"
    ],
    "Cozinha": [
        "Água 1.5l", "Água 5l", "Café", "Rolo de Cozinha", "Guardanapos", "Bolachas",
        "Chá", "Lava-Loiça", "Esfregões Verdes", "Esfregões Bravo", "Película Transparente",
        "Papel Alumínio", "Sacos congelação"
    ],
    "Diversos": [
        "Varetas Difusoras (Ambientador)", "Toalhitas Óculos"
    ]
};

// Create the shopping list UI dynamically
function criarListaCompras() {
    const form = document.getElementById('compras-form');
    form.innerHTML = ''; // Clear existing content

    Object.entries(listaCompras).forEach(([categoria, itens]) => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria';
        categoriaDiv.innerHTML = `<h3>${categoria}</h3>`;

        itens.forEach(item => {
            const itemDiv = criarItemCompra(item);
            categoriaDiv.appendChild(itemDiv);
        });

        form.appendChild(categoriaDiv);
    });

    // Itens Adicionais Section
    const adicionaisDiv = document.createElement('div');
    adicionaisDiv.className = 'categoria';
    adicionaisDiv.innerHTML = '<h3>Itens Adicionais</h3>';
    for (let i = 0; i < 5; i++) {
        const itemDiv = criarItemCompraEmBranco();
        adicionaisDiv.appendChild(itemDiv);
    }
    form.appendChild(adicionaisDiv);

    // Optionally, add the "Add Item" button
    adicionarBotaoAdicionarItem();
}

// Create a predefined shopping item
function criarItemCompra(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <span class="item-nome">${item}</span>
        </div>
        <div class="item-controles">
            <input type="number" class="item-quantidade" value="0" min="0" max="99">
            <button type="button" class="btn-aumentar" aria-label="Aumentar quantidade">+</button>
            <button type="button" class="btn-diminuir" aria-label="Diminuir quantidade">-</button>
            <button type="button" class="btn-zero" aria-label="Zerar quantidade">0</button>
            <button type="button" class="btn-local-c" aria-label="Marcar como Casa">C</button>
        </div>
    `;
    return itemDiv;
}

// Create a blank custom shopping item
function criarItemCompraEmBranco() {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <input type="text" class="item-nome-custom" placeholder="Novo item">
            <input type="number" class="item-quantidade" value="0" min="0" max="99">
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

// Function to add the "Add Item" button dynamically
function adicionarBotaoAdicionarItem() {
    const section = document.getElementById('lista-compras');
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.id = 'btn-add-item';
    addButton.textContent = 'Adicionar Item';
    addButton.style.marginTop = '10px'; // Adjust styling as needed
    section.appendChild(addButton);

    // Attach event listener
    addButton.addEventListener('click', adicionarNovoItem);
}

// Function to add a new custom item
function adicionarNovoItem() {
    const form = document.getElementById('compras-form');
    const adicionaisDiv = Array.from(form.children).find(div => div.querySelector('h3')?.textContent === 'Itens Adicionais');

    if (adicionaisDiv) {
        const novoItem = criarItemCompraEmBranco();
        adicionaisDiv.appendChild(novoItem);
        // Optionally, scroll to the new item
        novoItem.scrollIntoView({ behavior: 'smooth' });
        // Focus the new item's name input
        novoItem.querySelector('.item-nome-custom').focus();
    }
}

// Save the current shopping list to Firestore
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};
    let nomesDuplicados = new Set();
    let temNomesInvalidos = false;

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || (nomeElement.value ? nomeElement.value.trim() : '');
        const quantidade = parseInt(item.querySelector('.item-quantidade').value, 10);
        const local = item.getAttribute('data-local') || 'Não definido';

        if (nome && quantidade > 0) {
            if (listaParaSalvar[nome]) {
                nomesDuplicados.add(nome);
            } else {
                listaParaSalvar[nome] = { quantidade, local };
            }
        } else if (nome && quantidade === 0) {
            // Optionally handle items with quantity 0
        } else if (!nome && quantidade > 0) {
            temNomesInvalidos = true;
        }
    });

    if (nomesDuplicados.size > 0) {
        alert(`Os seguintes itens estão duplicados e serão removidos: ${Array.from(nomesDuplicados).join(', ')}`);
        // Remove duplicates
        nomesDuplicados.forEach(nome => {
            delete listaParaSalvar[nome];
        });
    }

    if (temNomesInvalidos) {
        alert('Existem itens com nomes vazios. Por favor, preencha todos os nomes de itens.');
        return;
    }

    try {
        await setDoc(doc(db, "listas_compras", "lista_atual"), {
            itens: listaParaSalvar,
            ultimaAtualizacao: Timestamp.now()
        });
        console.log("Lista de compras atualizada com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar a lista de compras: ", e);
        alert('Ocorreu um erro ao salvar a lista de compras.');
    }
}

// Load the shopping list from Firestore
async function carregarListaCompras() {
    try {
        const docRef = doc(db, "listas_compras", "lista_atual");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const itens = data.itens;

            document.querySelectorAll('.item-compra').forEach(item => {
                const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
                const nome = nomeElement.textContent.trim() || (nomeElement.value ? nomeElement.value.trim() : '');
                if (itens[nome]) {
                    item.querySelector('.item-quantidade').value = itens[nome].quantidade;
                    item.setAttribute('data-local', itens[nome].local);

                    if (itens[nome].local.includes('C')) {
                        item.querySelector('.btn-local-c').classList.add('active');
                    } else {
                        item.querySelector('.btn-local-c').classList.remove('active');
                    }

                    // Add or remove the 'item-comprado' class based on quantity
                    if (itens[nome].quantidade > 0) {
                        item.classList.add('item-comprado');
                    } else {
                        item.classList.remove('item-comprado');
                    }
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar a lista de compras: ", e);
    }
}

// Update location data
function updateLocalData(item) {
    const local = item.getAttribute('data-local') === 'C' ? 'Não definido' : 'C';
    item.setAttribute('data-local', local);
}

// Generate the summary of the shopping list
function gerarResumo() {
    const itens = document.querySelectorAll('.item-compra');
    let resumo = '';

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || (nomeElement.value ? nomeElement.value.trim() : '');
        const quantidade = item.querySelector('.item-quantidade').value;
        const local = item.getAttribute('data-local');

        if (nome && parseInt(quantidade, 10) > 0) {
            let localDisplay = local === 'C' ? ' (Casa)' : '';
            resumo += `${nome}: ${quantidade}${localDisplay}\n`;
        }
    });

    return resumo;
}

// Send the shopping list via email using EmailJS
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
    })
    .then(function(response) {
        console.log('E-mail enviado com sucesso!', response.status, response.text);
        alert('E-mail enviado com sucesso!');
    }, function(error) {
        console.error('Erro ao enviar e-mail:', error);
        alert('Erro ao enviar o e-mail.');
    });
}

// Clear the UI
function clearComprasUI() {
    const form = document.getElementById('compras-form');
    form.innerHTML = '';
}

// Populate the UI with data from Firebase
function populateComprasUI(itens) {
    // Remove this line to prevent resetting the UI
    // criarListaCompras();

    document.querySelectorAll('.item-compra').forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || (nomeElement.value ? nomeElement.value.trim() : '');
        if (itens[nome]) {
            item.querySelector('.item-quantidade').value = itens[nome].quantidade;
            item.setAttribute('data-local', itens[nome].local);
            if (itens[nome].local.includes('C')) {
                item.querySelector('.btn-local-c').classList.add('active');
            } else {
                item.querySelector('.btn-local-c').classList.remove('active');
            }

            // Add or remove the 'item-comprado' class based on quantity
            if (itens[nome].quantidade > 0) {
                item.classList.add('item-comprado');
            } else {
                item.classList.remove('item-comprado');
            }
        } else {
            // For custom items not present in Firestore, reset their fields
            if (item.querySelector('.item-nome-custom')) {
                item.querySelector('.item-quantidade').value = 0;
                item.setAttribute('data-local', 'Não definido');
                item.querySelector('.btn-local-c').classList.remove('active');
                item.classList.remove('item-comprado');
            }
        }
    });

    aplicarFiltro(document.getElementById('search-input').value); // Apply current filter after loading data
}

// Monitor real-time updates from Firebase
function monitorListaCompras() {
    const docRef = doc(db, "listas_compras", "lista_atual");

    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            clearComprasUI();
            criarListaCompras();
            populateComprasUI(data.itens);
        } else {
            console.log("Nenhum documento encontrado!");
        }
    });
}

// Apply search filter
function aplicarFiltro(filtro) {
    const filtroLower = filtro.toLowerCase();
    document.querySelectorAll('.item-compra').forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent.trim() || item.querySelector('.item-nome-custom')?.value.trim();
        if (nome.toLowerCase().includes(filtroLower)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Attach all event listeners
function attachEventListeners() {
    // Event Delegation for item controls
    document.getElementById('compras-form').addEventListener('click', (e) => {
        const item = e.target.closest('.item-compra');
        if (!item) return; // Click outside an item-compra

        if (e.target.classList.contains('btn-aumentar')) {
            const input = item.querySelector('.item-quantidade');
            input.value = Math.min(parseInt(input.value, 10) + 1, 99);

            if (parseInt(input.value, 10) > 0) {
                item.classList.add('item-comprado');
            } else {
                item.classList.remove('item-comprado');
            }

            salvarListaCompras();
        } else if (e.target.classList.contains('btn-diminuir')) {
            const input = item.querySelector('.item-quantidade');
            input.value = Math.max(parseInt(input.value, 10) - 1, 0);

            if (parseInt(input.value, 10) > 0) {
                item.classList.add('item-comprado');
            } else {
                item.classList.remove('item-comprado');
            }

            salvarListaCompras();
        } else if (e.target.classList.contains('btn-zero')) {
            const input = item.querySelector('.item-quantidade');
            input.value = 0;

            item.classList.remove('item-comprado');

            salvarListaCompras();
        } else if (e.target.classList.contains('btn-local-c')) {
            e.target.classList.toggle('active');
            updateLocalData(item);
            salvarListaCompras();
        }
    });

    // Button Requisitar
    document.getElementById('btn-requisitar').addEventListener('click', async () => {
        const resumo = gerarResumo();
        const resumoConteudo = document.getElementById('resumo-conteudo');
        resumoConteudo.innerHTML = resumo.replace(/\n/g, '<br>');
        document.getElementById('resumo').style.display = 'block';
        await salvarListaCompras();
    });

    // Button Enviar Email
    document.getElementById('btn-enviar-email').addEventListener('click', () => enviarEmailListaCompras(gerarResumo()));

    // Search Bar Event Listeners
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');

    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() !== '') {
            clearSearchBtn.classList.add('visible');
        } else {
            clearSearchBtn.classList.remove('visible');
        }
        aplicarFiltro(e.target.value);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        aplicarFiltro('');
    });

    // Add Item Button Event Listener
    // The button is added dynamically, so event listener is already attached in 'adicionarBotaoAdicionarItem'
}

// Initialize listeners and UI configuration
document.addEventListener('DOMContentLoaded', () => {
    criarListaCompras();
    carregarListaCompras();
    attachEventListeners();
});

// Function to add a new custom item (as defined earlier)
function adicionarNovoItem() {
    const form = document.getElementById('compras-form');
    const adicionaisDiv = Array.from(form.children).find(div => div.querySelector('h3')?.textContent === 'Itens Adicionais');

    if (adicionaisDiv) {
        const novoItem = criarItemCompraEmBranco();
        adicionaisDiv.appendChild(novoItem);
        novoItem.scrollIntoView({ behavior: 'smooth' });
        novoItem.querySelector('.item-nome-custom').focus();
    }
}
