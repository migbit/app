// js/caixa.js

// Importar a instância do Firestore do script.js e funções necessárias do Firestore
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const caixaForm = document.getElementById('caixa-form');
const relatorioCaixaDiv = document.getElementById('relatorio-caixa');
const btnEntrada = document.getElementById('btn-entrada');
const btnSaida = document.getElementById('btn-saida');
const tipoInput = document.getElementById('tipo');

// Configurar os botões de tipo de transação
btnEntrada.addEventListener('click', () => setTipoTransacao('Entrada'));
btnSaida.addEventListener('click', () => setTipoTransacao('Saída'));

/**
 * Define o tipo de transação e atualiza as classes dos botões para refletir a seleção.
 * @param {string} tipo - O tipo de transação ('Entrada' ou 'Saída').
 */
function setTipoTransacao(tipo) {
    tipoInput.value = tipo;
    btnEntrada.classList.toggle('btn-active', tipo === 'Entrada');
    btnSaida.classList.toggle('btn-active', tipo === 'Saída');
}

/**
 * Formata um número com separadores de milhares e duas casas decimais.
 * @param {number} number - O número a ser formatado.
 * @returns {string} O número formatado.
 */
function formatNumber(number) {
    return number.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'decimal' });
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
            transacoes.push({ ...data, id: doc.id });
        });

        // Criar HTML para exibir as transações
        let html = '<h3>Transações</h3>';
        html += '<table>';
        html += '<tr><th>Data</th><th>Tipo</th><th>Valor (€)</th></tr>';
        transacoes.forEach((t) => {
            const date = t.timestamp.toDate().toLocaleDateString('pt-PT');
            const valorClass = t.valor >= 0 ? 'valor-positivo' : 'valor-negativo';
            const formattedValor = formatNumber(Math.abs(t.valor));
            html += `<tr>
                <td>${date}</td>
                <td>${t.tipo}</td>
                <td class="${valorClass} formatted-number">${t.valor >= 0 ? '+' : '-'}€${formattedValor}</td>
            </tr>`;
        });
        html += '</table>';

        // Adicionar o total em caixa
        const totalClass = totalCaixa >= 0 ? 'valor-positivo' : 'valor-negativo';
        const formattedTotal = formatNumber(Math.abs(totalCaixa));
        html += `<div class="total-caixa">Total em caixa: <span class="${totalClass} formatted-number">${totalCaixa >= 0 ? '+' : '-'}€${formattedTotal}</span></div>`;

        relatorioCaixaDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatório de caixa: ", e);
        relatorioCaixaDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Carregar o relatório ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
});