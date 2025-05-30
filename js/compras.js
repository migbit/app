// Import Firebase modules
import { db } from './script.js'; // Ensure that './script.js' correctly exports the initialized Firestore instance
import { doc, setDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Define a estrutura da lista de compras
const listaCompras = {
    "Produtos Limpeza": ["Lixívia tradicional", "Multiusos com Lixívia", "Gel com Lixívia", "CIF", "Limpeza Chão (Lava Tudo)", "Limpeza Chão (Madeira)", "Limpa Vidros", "Limpeza Potente", "Limpeza Placas", "Vinagre", "Álcool"],
    "Roupa": ["Detergente Roupa", "Amaciador", "Lixívia Roupa Branca", "Tira Nódoas", "Tira Gorduras", "Oxi Active", "Branqueador", "Perfumador"],
    "WC": ["Papel Higiénico", "Gel WC Sanitas", "Toalhitas", "Toalhitas Desmaquilhantes", "Blocos Sanitários", "Anticalcário", "Limpeza Chuveiro", "Desentupidor de Canos", "Manutenção Canos", "Papel Higiénico Húmido", "Sabonete Líquido"],
    "Cozinha": ["Água 1.5l", "Água 5l", "Café", "Rolo de Cozinha", "Guardanapos", "Bolachas", "Chá", "Lava-Loiça", "Esfregões Verdes", "Esfregões Bravo", "Película Transparente", "Papel Alumínio", "Bolachas", "Sacos congelação"],
    "Diversos": ["Varetas Difusoras (Ambientador)", "Limpa Óculos"]
};

// Function to create the shopping list UI
function criarListaCompras() {
    const form = document.getElementById('compras-form');

    // Create predefined categories and items
    Object.entries(listaCompras).forEach(([categoria, itens]) => {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria';
        categoriaDiv.innerHTML = `<h3>${categoria}</h3>`; // Use backticks for template literals

        itens.forEach(item => {
            const itemDiv = criarItemCompra(item);
            categoriaDiv.appendChild(itemDiv);
        });

        form.appendChild(categoriaDiv);
    });

    // Create 'Itens Adicionais' category for custom items
    const adicionaisDiv = document.createElement('div');
    adicionaisDiv.className = 'categoria';
    adicionaisDiv.innerHTML = `
        <h3>Itens Adicionais</h3>
        <div id="custom-items-container">
            <!-- Custom items will be appended here -->
        </div>
        <button type="button" id="btn-adicionar-custom-item">Adicionar Item</button>
    `;
    form.appendChild(adicionaisDiv);
}

// Function to create a predefined shopping item
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

// Function to create a custom shopping item (initially blank)
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
            <button type="button" class="btn-remover-custom-item" aria-label="Remover item">🗑️</button>
        </div>
    `;
    return itemDiv;
}

// Function to save the current shopping list to Firebase
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        let nome = '';
        if (nomeElement.classList.contains('item-nome')) {
            nome = nomeElement.textContent.trim();
        } else if (nomeElement.classList.contains('item-nome-custom')) {
            nome = nomeElement.value.trim();
        }

        const quantidade = parseInt(item.querySelector('.item-quantidade').value, 10);
        const local = item.getAttribute('data-local') || 'Não definido';

        if (nome && quantidade > 0) {
            if (listaParaSalvar[nome]) {
                // Handle duplicate names by aggregating quantities
                listaParaSalvar[nome].quantidade += quantidade;
            } else {
                listaParaSalvar[nome] = { quantidade, local };
            }
        }
    });
async function salvarItem(nome, quantidade, local) {
  const ref = doc(db, "listas_compras", "lista_atual");
  await updateDoc(ref, {
    [`itens.${nome}`]: { quantidade, local },
    ultimaAtualizacao: Timestamp.now()
  });
}

// In each button branch, replace your save with:
salvarItem(itemNome, novaQuantidade, novoLocal);
   }

// Function to generate a summary of the shopping list
function gerarResumo() {
    const itens = document.querySelectorAll('.item-compra');
    let resumo = '';

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || nomeElement.value.trim();
        const quantidade = item.querySelector('.item-quantidade').value;
        const local = item.getAttribute('data-local');

        if (nome && parseInt(quantidade, 10) > 0) {
            let localDisplay = local === 'C' ? ' (Casa)' : '';
            resumo += `${nome}: ${quantidade}${localDisplay}\n`;
        }
    });

    return resumo;
}

// Function to send the shopping list via EmailJS
function enviarEmailListaCompras(resumo) {
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS não está definido.');
        alert('Erro ao enviar o e-mail.');
        return;
    }

    emailjs.send('service_tuglp9h', 'template_4micnki', {
        to_name: "apartments.oporto@gmail.com", // Verify if this should be 'to_email'
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

// Function to populate the shopping list UI with data from Firebase
import { Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

function populateComprasUI(itens) {
  const form = document.getElementById('compras-form');

  // 1) Fully clear and rebuild the form skeleton
  form.innerHTML = '';
  criarListaCompras();

  // 2) Populate with Firestore data
  // Build a set of predefined item names for quick lookup
  const predefined = new Set();
  Object.values(listaCompras).flat().forEach(name => predefined.add(name));

  for (const [nome, detalhes] of Object.entries(itens)) {
    const { quantidade, local } = detalhes;

    if (predefined.has(nome)) {
      // Predefined items live under sections, find their inputs/buttons by data-name
      const container = form.querySelector(`[data-name="${nome}"]`);
      if (!container) continue; // safety
      container.querySelector('.item-quantidade').textContent = quantidade;
      container.querySelector('.item-local').textContent = local;
    } else {
      // Custom items go into #custom-items-container
      const customContainer = document.getElementById('custom-items-container');
      const novoItem = criarItemCompraEmBranco();           // creates the HTML structure
      novoItem.setAttribute('data-name', nome);
      novoItem.querySelector('.item-nome').textContent = nome;
      novoItem.querySelector('.item-quantidade').textContent = quantidade;
      novoItem.querySelector('.item-local').textContent = local;
      customContainer.appendChild(novoItem);
    }
  }

  // 3) Re-apply any active search filter
  const search = document.getElementById('search-input').value;
  aplicarFiltro(search);
}

// Function to monitor real-time updates from Firebase
function monitorListaCompras() {
    const docRef = doc(db, "listas_compras", "lista_atual");

    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Dados recebidos do Firebase:", data);
            populateComprasUI(data.itens);
        } else {
            console.log("Nenhum documento encontrado!");
        }
    }, (error) => {
        console.error("Erro ao monitorar a lista de compras: ", error);
    });
}

// Function to update the 'data-local' attribute
function updateLocalData(item) {
    const local = item.getAttribute('data-local') === 'C' ? 'Não definido' : 'C';
    item.setAttribute('data-local', local);
}

// Function to apply the search filter
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

// Function to attach all event listeners
function attachEventListeners() {
    // Use Event Delegation for efficiency
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
        } else if (e.target.classList.contains('btn-remover-custom-item')) {
            // Remove the custom item from the UI
            item.remove();
            salvarListaCompras();
        }
    });

     // Delegated click‐handler for everything, including “Adicionar Item”
 document.getElementById('compras-form').addEventListener('click', e => {
   // … your existing cases for btn-aumentar, btn-diminuir, btn-zero, btn-remover-custom-item …

   // “Adicionar Item” via delegation
   if (e.target.id === 'btn-adicionar-custom-item') {
     const customItemsContainer = document.getElementById('custom-items-container');
     const newCustomItem = criarItemCompraEmBranco();
     customItemsContainer.appendChild(newCustomItem);
   }
 });

    // "Requisitar" Button
    document.getElementById('btn-requisitar').addEventListener('click', async () => {
        const resumo = gerarResumo();
        const resumoConteudo = document.getElementById('resumo-conteudo');
        resumoConteudo.innerHTML = resumo.replace(/\n/g, '<br>');
        document.getElementById('resumo').style.display = 'block';
        await salvarListaCompras();
    });

    // "Enviar Email" Button
    document.getElementById('btn-enviar-email').addEventListener('click', () => enviarEmailListaCompras(gerarResumo()));

    // Event listeners for the search bar
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
}

// Initialize listeners and UI setup on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    criarListaCompras();    // Create the list initially
    attachEventListeners(); // Attach event listeners (only once)
    monitorListaCompras();  // Start real-time listener
});
