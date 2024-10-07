// js/compras.js
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { enviarEmailUrgencia } from './script.js';

// Estrutura de dados para a lista de compras
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
        "Manutenção Canos", "Papel Higiénico Húmido"
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

function criarListaCompras() {
    const form = document.getElementById('compras-form');
    
    for (const [categoria, itens] of Object.entries(listaCompras)) {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria';
        categoriaDiv.innerHTML = `<h3>${categoria}</h3>`;
        
        itens.forEach(item => {
            const itemDiv = criarItemCompra(item);
            categoriaDiv.appendChild(itemDiv);
        });
        
        // Adicionar campos em branco para itens adicionais
        for (let i = 0; i < 3; i++) {
            const itemDiv = criarItemCompraEmBranco();
            categoriaDiv.appendChild(itemDiv);
        }
        
        form.appendChild(categoriaDiv);
    }
    
    // Adicionar campos em branco extras no final
    const diversosDiv = document.createElement('div');
    diversosDiv.className = 'categoria';
    diversosDiv.innerHTML = '<h3>Itens Adicionais</h3>';
    for (let i = 0; i < 10; i++) {
        const itemDiv = criarItemCompraEmBranco();
        diversosDiv.appendChild(itemDiv);
    }
    form.appendChild(diversosDiv);
}

function criarItemCompra(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-compra';
    itemDiv.innerHTML = `
        <div class="item-info">
            <span class="item-nome">${item}</span>
            <div class="item-controles">
                <input type="number" value="0" min="0" class="item-quantidade">
                <button type="button" class="btn-aumentar">+</button>
                <button type="button" class="btn-diminuir">-</button>
            </div>
        </div>
        <div class="item-acoes">
            <select class="item-local">
                <option value="Local">Local</option>
                <option value="123">123</option>
                <option value="1248">1248</option>
                <option value="Escritório">Escritório</option>
                <option value="Lavandaria">Lavandaria</option>
                <option value="Casa">Casa</option>
            </select>
            <button type="button" class="btn-limpar">Limpar</button>
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
            <div class="item-controles">
                <input type="number" value="0" min="0" class="item-quantidade">
                <button type="button" class="btn-aumentar">+</button>
                <button type="button" class="btn-diminuir">-</button>
            </div>
        </div>
        <div class="item-acoes">
            <select class="item-local">
                <option value="Local">Local</option>
                <option value="123">123</option>
                <option value="1248">1248</option>
                <option value="Escritório">Escritório</option>
                <option value="Lavandaria">Lavandaria</option>
                <option value="Casa">Casa</option>
            </select>
            <button type="button" class="btn-limpar">Limpar</button>
        </div>
    `;
    return itemDiv;
}

// Função para salvar a lista de compras no Firebase
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = [];

    itens.forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent || item.querySelector('.item-nome-custom')?.value;
        const quantidade = parseInt(item.querySelector('.item-quantidade').value);
        const local = item.querySelector('.item-local').value;

        if (nome && quantidade > 0) {
            listaParaSalvar.push({
                nome,
                quantidade,
                local
            });
        }
    });

    if (listaParaSalvar.length === 0) {
        alert('Não há itens para salvar.');
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "listas_compras"), {
            itens: listaParaSalvar,
            dataRequisicao: Timestamp.now()
        });
        console.log("Lista de compras salva com ID: ", docRef.id);
        alert('Lista de compras salva com sucesso!');
    } catch (e) {
        console.error("Erro ao salvar a lista de compras: ", e);
        alert('Ocorreu um erro ao salvar a lista de compras.');
    }
}

// Função para gerar o resumo da lista de compras
function gerarResumo() {
    const itens = document.querySelectorAll('.item-compra');
    let resumo = '';

    itens.forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent || item.querySelector('.item-nome-custom')?.value;
        const quantidade = item.querySelector('.item-quantidade').value;
        const local = item.querySelector('.item-local').value;

        if (nome && quantidade > 0) {
            resumo += `${nome}: ${quantidade} (${local})\n`;
        }
    });

    return resumo;
}

// Função para exibir o resumo e salvar no Firebase
async function exibirResumoESalvar() {
    const resumo = gerarResumo();
    const resumoConteudo = document.getElementById('resumo-conteudo');
    resumoConteudo.textContent = resumo;
    document.getElementById('resumo').style.display = 'block';

    // Salvar no Firebase
    await salvarListaCompras();
}

// Função para enviar e-mail (a ser implementada)
function enviarEmail() {
    const resumo = gerarResumo();
    // Implementar a lógica de envio de e-mail aqui usando o EmailJS
    console.log("Enviando e-mail com o resumo:", resumo);
    
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
        alert('Ocorreu um erro ao enviar o e-mail.');
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    criarListaCompras();

    document.getElementById('compras-form').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-aumentar')) {
            e.target.previousElementSibling.value = parseInt(e.target.previousElementSibling.value) + 1;
        } else if (e.target.classList.contains('btn-diminuir')) {
            const input = e.target.previousElementSibling.previousElementSibling;
            input.value = Math.max(0, parseInt(input.value) - 1);
        } else if (e.target.classList.contains('btn-limpar')) {
            const itemDiv = e.target.closest('.item-compra');
            itemDiv.querySelector('.item-quantidade').value = 0;
            itemDiv.querySelector('.item-local').value = 'Local';
            const nomeCustom = itemDiv.querySelector('.item-nome-custom');
            if (nomeCustom) nomeCustom.value = '';
        }
    });

    document.getElementById('btn-requisitar').addEventListener('click', exibirResumoESalvar);
    document.getElementById('btn-enviar-email').addEventListener('click', enviarEmail);
});