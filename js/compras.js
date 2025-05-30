// Import Firebase modules
import { db } from './script.js'; // Ensure that './script.js' correctly exports the initialized Firestore instance
import { doc, updateDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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

 // Helper: save a single item to Firebase (per-item update, avoids overwrites)
 async function salvarItem(nome, quantidade, local) {
   const ref = doc(db, "listas_compras", "lista_atual");
   await updateDoc(ref, {
     [`itens.${nome}`]: { quantidade, local },
     ultimaAtualizacao: Timestamp.now()
   });
 }

 // → In your btn-aumentar, btn-diminuir, btn-zero, btn-local-c and btn-remover branches,
 //    call salvarItem(itemNome, novaQuantidade, novoLocal) instead of salvarListaCompras().

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
    // 1) set the quantity input’s value
    container.querySelector('.item-quantidade').value = quantidade;
    // 2) store the location flag on the container
    container.setAttribute('data-local', local);
    // 3) toggle the “C” button active state
    container.querySelector('.btn-local-c').classList.toggle('active', local === 'C');
    } else {
      // Custom items go into #custom-items-container
      const customContainer = document.getElementById('custom-items-container');
      const novoItem = criarItemCompraEmBranco();           // creates the HTML structure
      novoItem.setAttribute('data-name', nome);
      novoItem.querySelector('.item-nome').textContent = nome;
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
  const form = document.getElementById('compras-form');

  form.addEventListener('click', async e => {
    // 1) “Adicionar Item” lives here:
    if (e.target.id === 'btn-adicionar-custom-item') {
      document
        .getElementById('custom-items-container')
        .appendChild(criarItemCompraEmBranco());
      return; // no further handling for this click
    }

    // 2) Everything else needs an .item-compra ancestor
    const item = e.target.closest('.item-compra');
    if (!item) return;

    // Grab the quantity input and current name/local
    const inp    = item.querySelector('.item-quantidade');
    const nomeEl = item.querySelector('.item-nome, .item-nome-custom');
    const nome   = nomeEl.textContent?.trim() || nomeEl.value.trim();
    let   local  = item.getAttribute('data-local') || 'Não definido';

    // 3) Handle each button type
    if (e.target.classList.contains('btn-aumentar')) {
      inp.value = Math.min(+inp.value + 1, 99);
    }
    else if (e.target.classList.contains('btn-diminuir')) {
      inp.value = Math.max(+inp.value - 1, 0);
    }
    else if (e.target.classList.contains('btn-zero')) {
      inp.value = 0;
    }
    else if (e.target.classList.contains('btn-local-c')) {
      // toggle C vs Não definido
      local = local === 'C' ? 'Não definido' : 'C';
      item.setAttribute('data-local', local);
      e.target.classList.toggle('active');
    }
    else if (e.target.classList.contains('btn-remover-custom-item')) {
      item.remove();
      // no need to save nome/quantidade after removal
      await salvarItem(nome, 0, 'Não definido');
      return;
    }
    else {
      return; // clicked something else
    }

    // 4) Visual feedback
    item.classList.toggle('item-comprado', +inp.value > 0);

    // 5) Save *just* this item
    await salvarItem(nome, parseInt(inp.value, 10), local);
  });


    // "Requisitar" Button
document
  .getElementById('btn-requisitar')
  .addEventListener('click', async () => {
    const resumo = gerarResumo();
    document.getElementById('resumo-conteudo')
      .innerHTML = resumo.replace(/\n/g, '<br>');
    document.getElementById('resumo').style.display = 'block';
    // now persist every non-zero item:
    document.querySelectorAll('.item-compra').forEach(async item => {
      const nomeEl = item.querySelector('.item-nome, .item-nome-custom');
      const nome   = nomeEl.textContent?.trim() || nomeEl.value.trim();
      const qt     = parseInt(item.querySelector('.item-quantidade').value, 10);
      const local  = item.getAttribute('data-local') || 'Não definido';
      if (nome && qt > 0) await salvarItem(nome, qt, local);
    });
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
