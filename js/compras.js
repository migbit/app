// js/compras.js
import { db } from './script.js';
import { collection, doc, setDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
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

// Modificar a função salvarListaCompras
async function salvarListaCompras() {
    const itens = document.querySelectorAll('.item-compra');
    let listaParaSalvar = {};

    itens.forEach(item => {
        const nome = item.querySelector('.item-nome')?.textContent || item.querySelector('.item-nome-custom')?.value;
        const quantidade = parseInt(item.querySelector('.item-quantidade').value);
        const local = item.querySelector('.item-local').value;

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
        alert('Lista de compras atualizada com sucesso!');
    } catch (e) {
        console.error("Erro ao salvar a lista de compras: ", e);
        alert('Ocorreu um erro ao salvar a lista de compras.');
    }
}

// Modificar a função carregarListaCompras
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
                    item.querySelector('.item-local').value = itens[nome].local;
                }
            });

            // Adicionar itens personalizados que não estão na lista predefinida
            Object.entries(itens).forEach(([nome, dados]) => {
                if (!document.querySelector(`.item-nome:contains('${nome}'), .item-nome-custom[value='${nome}']`)) {
                    const itemDiv = criarItemCompraEmBranco();
                    itemDiv.querySelector('.item-nome-custom').value = nome;
                    itemDiv.querySelector('.item-quantidade').value = dados.quantidade;
                    itemDiv.querySelector('.item-local').value = dados.local;
                    document.querySelector('.categoria:last-child').appendChild(itemDiv);
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar a lista de compras: ", e);
    }
}

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

async function exibirResumoESalvar() {
    const resumo = gerarResumo();
    const resumoConteudo = document.getElementById('resumo-conteudo');
    resumoConteudo.textContent = resumo;
    document.getElementById('resumo').style.display = 'block';

    // Salvar no Firebase
    await salvarListaCompras();
}

// Modificar a função enviarEmail
function enviarEmail() {
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS não está definido. Verifique se o script foi carregado corretamente.');
        alert('Ocorreu um erro ao tentar enviar o e-mail. Por favor, tente novamente mais tarde.');
        return;
    }

    const resumo = gerarResumo();
    
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
    carregarListaCompras();

    document.getElementById('compras-form').addEventListener('change', (e) => {
        if (e.target.classList.contains('item-quantidade') || 
            e.target.classList.contains('item-local') || 
            e.target.classList.contains('item-nome-custom')) {
            salvarListaCompras();
        }
    });

    document.getElementById('btn-requisitar').addEventListener('click', exibirResumoESalvar);
    document.getElementById('btn-enviar-email').addEventListener('click', enviarEmail);
});