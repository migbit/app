// js/modelo30.js

// Importar a instância do Firestore do script.js e funções necessárias do Firestore
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const modelo30Form = document.getElementById('modelo30-form');
const relatorioModelo30Div = document.getElementById('relatorio-modelo30');
const anoInput = document.getElementById('ano');
const mesSelect = document.getElementById('mes');

/**
 * Define o ano e mês atuais como padrão nos campos de entrada.
 */
function definirAnoMesAtual() {
    const hoje = new Date();
    anoInput.value = hoje.getFullYear();
    mesSelect.value = hoje.getMonth() + 1; // getMonth() retorna de 0 a 11
}

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', definirAnoMesAtual);

/**
 * Função para adicionar um registro de Modelo 30
 */
modelo30Form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ano = parseInt(anoInput.value);
    const mes = parseInt(mesSelect.value);
    const valor = parseFloat(document.getElementById('valor').value);

    if (isNaN(ano) || isNaN(mes) || isNaN(valor) || ano < 2000 || mes < 1 || mes > 12 || valor <= 0) {
        alert('Por favor, insira dados válidos.');
        return;
    }

    try {
        await addDoc(collection(db, "modelo30"), {
            ano: ano,
            mes: mes,
            valor: valor,
            timestamp: new Date()
        });
        alert('Modelo 30 registrado com sucesso!');
        modelo30Form.reset();
        definirAnoMesAtual();
        carregarRelatorio();
    } catch (e) {
        console.error("Erro ao registrar Modelo 30: ", e);
        alert('Ocorreu um erro ao registrar o Modelo 30.');
    }
});

/**
 * Função para carregar e exibir o relatório de Modelo 30
 */
async function carregarRelatorio() {
    relatorioModelo30Div.innerHTML = '<p>Carregando relatório...</p>';
    try {
        const q = query(collection(db, "modelo30"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        // Objeto para armazenar os valores agrupados por ano e mês
        const valoresAgrupados = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const ano = data.ano;
            const mes = data.mes;
            const valor = data.valor;

            const chave = `${ano}-${mes}`;
            if (!valoresAgrupados[chave]) {
                valoresAgrupados[chave] = { ano, mes, valor };
            } else {
                valoresAgrupados[chave].valor += valor;
            }
        });

        // Converter o objeto em array e ordenar por ano e mês (decrescente)
        const valoresOrdenados = Object.values(valoresAgrupados).sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            return b.mes - a.mes;
        });

        let html = '<table>';
        html += '<tr><th>Ano</th><th>Mês</th><th>Valor Total (€)</th></tr>';

        valoresOrdenados.forEach((item) => {
            const ano = item.ano;
            const mes = item.mes;
            const valorTotal = item.valor.toFixed(2);
            const nomeMes = obterNomeMes(mes);

            html += `<tr>
                        <td>${ano}</td>
                        <td>${nomeMes}</td>
                        <td>€ ${valorTotal}</td>
                     </tr>`;
        });

        html += '</table>';
        relatorioModelo30Div.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatório Modelo 30: ", e);
        relatorioModelo30Div.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

/**
 * Função auxiliar para obter o nome do mês a partir do número
 * @param {number} numeroMes - Número do mês (1-12)
 * @returns {string} Nome do mês correspondente
 */
function obterNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[numeroMes - 1] || 'Mês Inválido';
}

// Carregar o relatório ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
});
