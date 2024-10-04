// js/caixa.js

import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Selecionar elementos do DOM
const caixaForm = document.getElementById('caixa-form');
const relatorioCaixaDiv = document.getElementById('relatorio-caixa');
const btnEntrada = document.getElementById('btn-entrada');
const btnSaida = document.getElementById('btn-saida');
const tipoInput = document.getElementById('tipo');

// Configurar os botões de tipo de transação
btnEntrada.addEventListener('click', () => setTipoTransacao('Entrada'));
btnSaida.addEventListener('click', () => setTipoTransacao('Saída'));

function setTipoTransacao(tipo) {
    tipoInput.value = tipo;
    if (tipo === 'Entrada') {
        btnEntrada.classList.add('active');
        btnSaida.classList.remove('active');
    } else {
        btnSaida.classList.add('active');
        btnEntrada.classList.remove('active');
    }
}

// Função para adicionar uma transação
caixaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = tipoInput.value;
    const valor = parseFloat(document.getElementById('valor').value);

    if (!tipo || isNaN(valor) || valor <= 0) {
        alert('Por favor, selecione um tipo de transação e insira um valor válido.');
        return;
    }

    try {
        await addDoc(collection(db, "caixa"), {
            tipo: tipo,
            valor: tipo === 'Entrada' ? valor : -valor,
            timestamp: new Date()
        });
        alert('Transação registrada com sucesso!');
        caixaForm.reset();
        setTipoTransacao('');
        carregarRelatorio();
    } catch (e) {
        console.error("Erro ao registrar transação: ", e);
        alert('Ocorreu um erro ao registrar a transação.');
    }
});

// Função para carregar e exibir o relatório de caixa
async function carregarRelatorio() {
    relatorioCaixaDiv.innerHTML = '<p>Carregando relatório...</p>';
    try {
        const q = query(collection(db, "caixa"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        let totalCaixa = 0;
        let transacoes = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalCaixa += data.valor;
            transacoes.push(data);
        });

        // Criar HTML para exibir as transações
        let html = '<h3>Transações</h3>';
        html += '<table>';
        html += '<tr><th>Data</th><th>Tipo</th><th>Valor (€)</th></tr>';
        transacoes.forEach((t) => {
            const date = t.timestamp.toDate().toLocaleDateString('pt-PT');
            const valorClass = t.valor >= 0 ? 'valor-positivo' : 'valor-negativo';
            html += `<tr>
                <td>${date}</td>
                <td>${t.tipo}</td>
                <td class="${valorClass}">€ ${Math.abs(t.valor).toFixed(2)}</td>
            </tr>`;
        });
        html += '</table>';

        // Adicionar o total em caixa
        html += `<div class="total-caixa">Total em caixa: € ${totalCaixa.toFixed(2)}</div>`;

        relatorioCaixaDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatório de caixa: ", e);
        relatorioCaixaDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();

/* 
