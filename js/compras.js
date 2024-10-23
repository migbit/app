// js/compras.js
import { db } from './script.js';
import { collection, doc, setDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Structure of the shopping list
const listaCompras = {
    "Produtos Limpeza": [
        "Lixívia tradicional", "Multiusos com Lixívia", "Gel com Lixívia", "CIF",
        "Limpeza Chão (Lava Tudo)", "Limpeza Chão (Madeira)", "Limpa Vidros",
        "Limpeza Potente", "Limpeza Placas", "Vinagre"
    ],
    "Roupa": [
        "Detergente Roupa", "Amaciador", "Lixívia Roupa Branca", "Tira Nódoas",
        "Tira Gorduras", "Oxi Active", "Branqueador"
    ],
    "WC": [
        "Papel Higiénico", "Gel WC Sanitas", "Toalhitas", "Toalhitas Desmaquilhantes",
        "Blocos Sanitários", "Anticalcário", "Limpeza Chuveiro", "Desentupidor de Canos",
        "Manutenção Canos", "Papel Higiénico Húmido", "Sabonete Líquido"
    ],
    "Cozinha": [
        "Água 1.5l", "Água 5l", "Café", "Rolo de Cozinha", "Guardanapos", "Bolachas",
        "Chá", "Lava-Loiça", "Esfregões", "Película Transparente", "Papel Alumínio",
        "Sacos congelação"
    ],
    "Diversos": [
        "Varetas Difusoras (Ambientador)"
    ]
};

// Create the shopping list UI dynamically
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
    
    // Add blank fields for additional items
    const diversosDiv = document.createElement('div');
    diversosDiv.className = 'categoria';
    diversosDiv.innerHTML = '<h3>Itens Adicionais</h3>';
    for (let i = 0; i < 5; i++) {
        const itemDiv = criarItemCompraEmBranco();
        diversosDiv.appendChild(itemDiv);
    }
    form.appendChild(diversosDiv);
}

// Create an item element in the shopping list
function criarItemCompra(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <span class="item-nome">${item}</span>
        </div>
        <div class="item-controles">
            <input type="number" value="0" min="0" class="item-quantidade">
            <button type="button" class="btn-aumentar">+</button>
            <button type="button" class="btn-diminuir">-</button>
            <button type="button" class="btn-zero">0</button>
            <button type="button" class="btn-local-c">C</button>
        </div>
    `;
    return itemDiv;
}

// Create a blank item input for adding new items
function criarItemCompraEmBranco() {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <input type="text" class="item-nome-custom" placeholder="Novo item">
        </div>
        <div class="item-controles">
            <input type="number" value="0" min="0" class="item-quantidade">
            <button type="button" class="btn-aumentar">+</button>
            <button type="button" class="btn-diminuir">-</button>
            <button type="button" class="btn-zero">0</button>
            <button type="button" class="btn-local-c">C</button>
        </div>
    `;
    return itemDiv;
}

// Save the current shopping list to Firestore
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};

    itens.forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent || item.querySelector('.item-nome-custom')?.value;
        const quantidade = parseInt(item.querySelector('.item-quantidade').value);
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
                const nome = nomeElement.textContent || nomeElement.value;
                if (itens[nome]) {
                    item.querySelector('.item-quantidade').value = itens[nome].quantidade;
                    item.setAttribute('data-local', itens[nome].local);
                    
                    if (itens[nome].local.includes('C')) {
                        item.querySelector('.btn-local-c').classList.add('active');
                    }
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar a lista de compras: ", e);
    }
}

// Helper function to update local data based on button state
function updateLocalData(item) {
    const localC = item.querySelector('.btn-local-c').classList.contains('active') ? 'C' : '';
    const locaisSelecionados = localC || 'Não definido';

    item.setAttribute('data-local', locaisSelecionados);
}

// Generate the summary of the shopping list
function gerarResumo() {
    const itens = document.querySelectorAll('.item-compra');
    let resumo = '';

    itens.forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent || item.querySelector('.item-nome-custom')?.value;
        const quantidade = item.querySelector('.item-quantidade').value;
        const local = item.getAttribute('data-local');

        if (nome && parseInt(quantidade) > 0) {
            let localDisplay = '';
            if (local === 'C') {
                localDisplay = ' (Casa)';
            }
            resumo += `${nome}: ${quantidade}${localDisplay}\n`;
        }
    });

    return resumo;
}

// Display the summary and save the list
async function exibirResumoESalvar() {
    const resumo = gerarResumo();
    const resumoConteudo = document.getElementById('resumo-conteudo');
    resumoConteudo.innerHTML = resumo.replace(/\n/g, '<br>');
    document.getElementById('resumo').style.display = 'block';

    await salvarListaCompras();
}

// Send the shopping list by email using EmailJS
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    criarListaCompras();
    carregarListaCompras();

    document.getElementById('compras-form').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-aumentar')) {
            const input = e.target.previousElementSibling;
            input.value = parseInt(input.value) + 1;
            salvarListaCompras();
        } else if (e.target.classList.contains('btn-diminuir')) {
            const input = e.target.previousElementSibling.previousElementSibling;
            input.value = Math.max(0, parseInt(input.value) - 1);
            salvarListaCompras();
        } else if (e.target.classList.contains('btn-zero')) {
            const input = e.target.previousElementSibling.previousElementSibling.previousElementSibling;
            input.value = 0;
            salvarListaCompras();
        } else if (e.target.classList.contains('btn-local-c')) {
            e.target.classList.toggle('active');
            updateLocalData(e.target.closest('.item-compra'));
            salvarListaCompras();
        }
    });

    document.getElementById('btn-requisitar').addEventListener('click', exibirResumoESalvar);
    document.getElementById('btn-enviar-email').addEventListener('click', () => enviarEmailListaCompras(gerarResumo()));
});
