// js/taxa-municipal.js

// Importar a instância do Firestore do script.js e funções necessárias do Firestore
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const tmtForm = document.getElementById('tmt-form');
const relatorioTmtDiv = document.getElementById('relatorio-tmt');
const anoInput = document.getElementById('ano');
const mesSelect = document.getElementById('mes');

// Definir o ano e mês atuais como padrão
function definirAnoMesAtual() {
    const hoje = new Date();
    anoInput.value = hoje.getFullYear();
    mesSelect.value = hoje.getMonth() + 1;
}

document.addEventListener('DOMContentLoaded', definirAnoMesAtual);

// Função para adicionar um registro de T.M.T.
tmtForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apartamento = document.getElementById('apartamento').value;
    const valorTmtPorNoite = parseFloat(document.getElementById('valor-tmt').value);
    const ano = parseInt(anoInput.value);
    const mes = parseInt(mesSelect.value);
    const valorPagoOperador = parseFloat(document.getElementById('valor-pago-operador').value);
    const valorPagoDiretamente = parseFloat(document.getElementById('valor-pago-diretamente').value) || 0;
    const noitesExtra = parseInt(document.getElementById('noites-extra').value) || 0;
    const noitesCriancas = parseInt(document.getElementById('noites-criancas').value) || 0;

    // Validações
    if (!apartamento || isNaN(valorTmtPorNoite) || valorTmtPorNoite <= 0 || isNaN(ano) || ano < 2000 || isNaN(mes) || mes < 1 || mes > 12 || isNaN(valorPagoOperador) || valorPagoOperador < 0 || isNaN(valorPagoDiretamente) || valorPagoDiretamente < 0 || isNaN(noitesExtra) || noitesExtra < 0 || isNaN(noitesCriancas) || noitesCriancas < 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    try {
        await addDoc(collection(db, "tmt"), {
            apartamento,
            valor_tmt_por_noite: valorTmtPorNoite,
            ano,
            mes,
            valor_pago_operador_turistico: valorPagoOperador,
            valor_pago_diretamente: valorPagoDiretamente,
            noites_extra_7_dias: noitesExtra,
            noites_criancas: noitesCriancas,
            timestamp: new Date()
        });
        alert('T.M.T. registrada com sucesso!');
        tmtForm.reset();
        definirAnoMesAtual();
        carregarRelatorio();
    } catch (e) {
        console.error("Erro ao registrar T.M.T.: ", e);
        alert('Ocorreu um erro ao registrar a T.M.T.');
    }
});

// Função para carregar e exibir o relatório de T.M.T.
async function carregarRelatorio() {
    relatorioTmtDiv.innerHTML = '<p>Carregando relatório...</p>';
    try {
        const q = query(collection(db, "tmt"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        const groupedData123 = [];
        const groupedData1248 = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.apartamento === "123") {
                groupedData123.push(data);
            } else if (data.apartamento === "1248") {
                groupedData1248.push(data);
            }
        });

        const tableHTML123 = generateSummaryAndDetailsTable(groupedData123, "Apartamento 123");
        const tableHTML1248 = generateSummaryAndDetailsTable(groupedData1248, "Apartamento 1248");
        relatorioTmtDiv.innerHTML = tableHTML123 + "<br><br>" + tableHTML1248;
    } catch (e) {
        console.error("Erro ao carregar relatório T.M.T.: ", e);
        relatorioTmtDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Função para gerar tabela de resumo e permitir detalhes
function generateSummaryAndDetailsTable(data, titulo) {
    const groupedByMonth = {};
    data.forEach((entry) => {
        const key = `${entry.ano}-${entry.mes}`;
        if (!groupedByMonth[key]) {
            groupedByMonth[key] = [];
        }
        groupedByMonth[key].push(entry);
    });

    let html = `<h3>${titulo}</h3>`;
    Object.keys(groupedByMonth).forEach((key) => {
        const [ano, mes] = key.split("-");
        const monthName = obterNomeMes(parseInt(mes));
        const totalOperador = groupedByMonth[key].reduce((sum, item) => sum + item.valor_pago_operador_turistico, 0).toFixed(2);
        const totalDiretamente = groupedByMonth[key].reduce((sum, item) => sum + item.valor_pago_diretamente, 0).toFixed(2);

        html += `
            <div class="monthly-summary" data-details='${JSON.stringify(groupedByMonth[key])}'>
                <h4>${monthName} ${ano}</h4>
                <p>Valor Pago Operador: € ${totalOperador}</p>
                <p>Valor Pago Diretamente: € ${totalDiretamente}</p>
                <button onclick='mostrarDetalhes(this)'>Ver Detalhes</button>
            </div>
        `;
    });
    return html;
}

// Função para mostrar detalhes ao clicar
function mostrarDetalhes(button) {
    const details = JSON.parse(button.parentElement.dataset.details);
    let detailsHtml = "<table><thead><tr><th>Ano</th><th>Mês</th><th>Valor Pago Operador (€)</th><th>Valor Pago Diretamente (€)</th><th>Noites Extra 7 dias</th><th>Noites Crianças</th></tr></thead><tbody>";
    details.forEach(({ ano, mes, valor_pago_operador_turistico, valor_pago_diretamente, noites_extra_7_dias, noites_criancas }) => {
        const nomeMes = obterNomeMes(mes);
        detailsHtml += `
            <tr>
                <td>${ano}</td>
                <td>${nomeMes}</td>
                <td>€ ${valor_pago_operador_turistico.toFixed(2)}</td>
                <td>€ ${valor_pago_diretamente.toFixed(2)}</td>
                <td>${noites_extra_7_dias}</td>
                <td>${noites_criancas}</td>
            </tr>
        `;
    });
    detailsHtml += "</tbody></table>";
    const div = document.createElement("div");
    div.innerHTML = detailsHtml;
    button.parentElement.appendChild(div);
}

// Função auxiliar para obter o nome do mês a partir do número
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