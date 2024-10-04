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
        btnEntrada.classList.add('btn-active');
        btnEntrada.classList.remove('btn-inactive');
        btnSaida.classList.add('btn-inactive');
        btnSaida.classList.remove('btn-active');
    } else {
        btnSaida.classList.add('btn-active');
        btnSaida.classList.remove('btn-inactive');
        btnEntrada.classList.add('btn-inactive');
        btnEntrada.classList.remove('btn-active');
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
            valor: valor,
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
        let entradas = 0;
        let saidas = 0;
        let transacoes = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.tipo === "Entrada") {
                entradas += data.valor;
            } else if (data.tipo === "Saída") {
                saidas += data.valor;
            }
            transacoes.push(data);
        });

        const saldo = entradas - saidas;

        // Criar HTML para exibir os relatórios
        let html = '<h3>Resumo</h3>';
        html += '<table>';
        html += '<tr><th>Tipo</th><th>Total (€)</th></tr>';
        html += `<tr><td>Entradas</td><td>€ ${entradas.toFixed(2)}</td></tr>`;
        html += `<tr><td>Saídas</td><td>€ ${saidas.toFixed(2)}</td></tr>`;
        html += `<tr><td><strong>Saldo</strong></td><td><strong>€ ${saldo.toFixed(2)}</strong></td></tr>`;
        html += '</table>';

        html += '<h3>Últimas Transações</h3>';
        html += '<table>';
        html += '<tr><th>Tipo</th><th>Valor (€)</th><th>Data</th></tr>';
        transacoes.slice(0, 10).forEach((t) => {
            const date = t.timestamp.toDate().toLocaleDateString('pt-PT');
            html += `<tr>
                <td>${t.tipo}</td>
                <td>€ ${t.valor.toFixed(2)}</td>
                <td>${date}</td>
            </tr>`;
        });
        html += '</table>';

        relatorioCaixaDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatório de caixa: ", e);
        relatorioCaixaDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();