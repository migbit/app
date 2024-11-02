// Import Firebase modules
import { db } from './script.js';
import { doc, setDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Define a estrutura da lista de compras
const listaCompras = {
    "Produtos Limpeza": ["Lixívia tradicional", "Multiusos com Lixívia", "Gel com Lixívia", "CIF", "Limpeza Chão (Lava Tudo)", "Limpeza Chão (Madeira)", "Limpa Vidros", "Limpeza Potente", "Limpeza Placas", "Vinagre"],
    "Roupa": ["Detergente Roupa", "Amaciador", "Lixívia Roupa Branca", "Tira Nódoas", "Tira Gorduras", "Oxi Active", "Branqueador", "Perfumador"],
    "WC": ["Papel Higiénico", "Gel WC Sanitas", "Toalhitas", "Toalhitas Desmaquilhantes", "Blocos Sanitários", "Anticalcário", "Limpeza Chuveiro", "Desentupidor de Canos", "Manutenção Canos", "Papel Higiénico Húmido", "Sabonete Líquido"],
    "Cozinha": ["Água 1.5l", "Água 5l", "Café", "Rolo de Cozinha", "Guardanapos", "Bolachas", "Chá", "Lava-Loiça", "Esfregões Verdes", "Esfregões Bravo", "Película Transparente", "Papel Alumínio", "Sacos congelação"],
    "Diversos": ["Varetas Difusoras (Ambientador)", "Toalhitas Óculos"]
};

// Cria a interface da lista de compras
function criarListaCompras() {
    const form = document.getElementById('compras-form');
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

    const adicionaisDiv = document.createElement('div');
    adicionaisDiv.className = 'categoria';
    adicionaisDiv.innerHTML = '<h3>Itens Adicionais</h3>';
    for (let i = 0; i < 5; i++) {
        const itemDiv = criarItemCompraEmBranco();
        adicionaisDiv.appendChild(itemDiv);
    }
    form.appendChild(adicionaisDiv);
}

// Funções auxiliares para criar e popular elementos da UI
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
    return itemDiv;
}

// Salva a lista de compras atual no Firebase
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || nomeElement.value.trim();
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
    } catch (e) {
        console.error("Erro ao salvar a lista de compras: ", e);
        alert('Ocorreu um erro ao salvar a lista de compras.');
    }
}

// Gera o resumo da lista de compras
function gerarResumo() {
    const itens = document.querySelectorAll('.item-compra');
    let resumo = '';

    itens.forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || item.querySelector('.item-nome-custom').value.trim();
        const quantidade = item.querySelector('.item-quantidade').value;
        const local = item.getAttribute('data-local');

        if (nome && parseInt(quantidade, 10) > 0) {
            let localDisplay = local === 'C' ? ' (Casa)' : '';
            resumo += `${nome}: ${quantidade}${localDisplay}\n`;
        }
    });

    return resumo;
}

// Envia a lista de compras por email usando EmailJS
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

// Limpa e repopula a UI com dados do Firebase
function clearComprasUI() {
    const form = document.getElementById('compras-form');
    form.innerHTML = '';
}

function populateComprasUI(itens) {
    criarListaCompras();  // Cria os elementos básicos da UI
    
    document.querySelectorAll('.item-compra').forEach(item => {
        const nomeElement = item.querySelector('.item-nome') || item.querySelector('.item-nome-custom');
        const nome = nomeElement.textContent.trim() || item.querySelector('.item-nome-custom').value.trim();
        if (itens[nome]) {
            item.querySelector('.item-quantidade').value = itens[nome].quantidade;
            item.setAttribute('data-local', itens[nome].local);
            if (itens[nome].local.includes('C')) {
                item.querySelector('.btn-local-c').classList.add('active');
            }

            // Adicionar ou remover a classe 'item-comprado' baseado na quantidade
            if (itens[nome].quantidade > 0) {
                item.classList.add('item-comprado');
            } else {
                item.classList.remove('item-comprado');
            }
        }
    });

    aplicarFiltro(document.getElementById('search-input').value); // Aplica o filtro atual após carregar os dados
}


// Configura o listener em tempo real para atualizações do Firebase
function monitorListaCompras() {
    const docRef = doc(db, "listas_compras", "lista_atual");

    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            clearComprasUI();
            populateComprasUI(data.itens);
        } else {
            console.log("Nenhum documento encontrado!");
        }
    });
}

// Atualiza os dados de localidade
function updateLocalData(item) {
    const local = item.getAttribute('data-local') === 'C' ? 'Não definido' : 'C';
    item.setAttribute('data-local', local);
}

// Função para aplicar o filtro de busca
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

// Função para anexar todos os event listeners (anexada apenas uma vez)
function attachEventListeners() {
    // Utilizando Event Delegation para eficiência
    document.getElementById('compras-form').addEventListener('click', (e) => {
        const item = e.target.closest('.item-compra');
        if (!item) return; // Clique fora de um item-compra

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

    // Botão Requisitar
    document.getElementById('btn-requisitar').addEventListener('click', async () => {
        const resumo = gerarResumo();
        const resumoConteudo = document.getElementById('resumo-conteudo');
        resumoConteudo.innerHTML = resumo.replace(/\n/g, '<br>');
        document.getElementById('resumo').style.display = 'block';
        await salvarListaCompras();
    });

    // Botão Enviar Email
    document.getElementById('btn-enviar-email').addEventListener('click', () => enviarEmailListaCompras(gerarResumo()));

    // Event listeners para a barra de busca
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

// Inicializa os listeners e a configuração da UI
document.addEventListener('DOMContentLoaded', () => {
    monitorListaCompras();  // Inicia o listener em tempo real
    attachEventListeners(); // Anexa os event listeners iniciais (apenas uma vez)
    criarListaCompras();    // Cria a lista inicialmente
});
