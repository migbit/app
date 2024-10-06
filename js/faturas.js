// js/faturas.js

import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const faturaForm = document.getElementById('fatura-form');
const anoInput = document.getElementById('ano');
const mesSelect = document.getElementById('mes');

// Definir ano e mês atuais como padrão
function definirAnoMesAtual() {
    const hoje = new Date();
    anoInput.value = hoje.getFullYear();
    mesSelect.value = hoje.getMonth() + 1; // getMonth() retorna 0-11
}

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    definirAnoMesAtual();
    carregarRelatorioFaturacao();
    carregarRelatorioModelo30();
    carregarRelatorioTMT();
});

// Evento de submissão do formulário
faturaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obter valores dos campos
    const apartamento = document.getElementById('apartamento').value;
    const ano = parseInt(document.getElementById('ano').value);
    const mes = parseInt(document.getElementById('mes').value);
    const numeroFatura = document.getElementById('numero-fatura').value;
    const taxaAirbnb = parseFloat(document.getElementById('taxa-airbnb').value);
    const valorTransferencia = parseFloat(document.getElementById('valor-transferencia').value);
    const valorPagoOperador = parseFloat(document.getElementById('valor-pago-operador').value);
    const noitesExtra = parseInt(document.getElementById('noites-extra').value) || 0;
    const noitesCriancas = parseInt(document.getElementById('noites-criancas').value) || 0;
    const valorPagoDiretamente = parseFloat(document.getElementById('valor-pago-diretamente').value) || 0;
    const valorTmtPorNoite = parseFloat(document.getElementById('valor-tmt').value);

    // Validações básicas
    if (
        !apartamento ||
        isNaN(ano) || ano < 2000 ||
        isNaN(mes) || mes < 1 || mes > 12 ||
        !numeroFatura ||
        isNaN(taxaAirbnb) || taxaAirbnb < 0 ||
        isNaN(valorTransferencia) || valorTransferencia < 0 ||
        isNaN(valorPagoOperador) || valorPagoOperador < 0 ||
        isNaN(valorPagoDiretamente) || valorPagoDiretamente < 0 ||
        isNaN(valorTmtPorNoite) || valorTmtPorNoite <= 0 ||
        isNaN(noitesExtra) || noitesExtra < 0 ||
        isNaN(noitesCriancas) || noitesCriancas < 0
    ) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    try {
        // Salvar dados na coleção "faturas"
        await addDoc(collection(db, "faturas"), {
            apartamento,
            ano,
            mes,
            numeroFatura,
            taxaAirbnb,
            valorTransferencia,
            valorPagoOperador,
            noitesExtra,
            noitesCriancas,
            valorPagoDiretamente,
            valorTmtPorNoite,
            timestamp: new Date()
        });

        alert('Fatura registrada com sucesso!');
        faturaForm.reset();
        definirAnoMesAtual();

        // Recarregar relatórios
        carregarRelatorioFaturacao();
        carregarRelatorioModelo30();
        carregarRelatorioTMT();
    } catch (error) {
        console.error("Erro ao registrar fatura: ", error);
        alert('Ocorreu um erro ao registrar a fatura.');
    }
});

// Função para carregar Relatório de Faturação
async function carregarRelatorioFaturacao() {
    const relatorioDiv = document.getElementById('relatorio-faturacao-conteudo');
    relatorioDiv.innerHTML = '<p>Carregando relatório...</p>';

    try {
        const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        const dadosAgrupados = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.ano}-${data.mes}`;
            if (!dadosAgrupados[key]) {
                dadosAgrupados[key] = {
                    ano: data.ano,
                    mes: data.mes,
                    totalTransferencia: 0,
                    totalTaxaAirbnb: 0,
                    totalFatura: 0,
                    detalhes: []
                };
            }

            dadosAgrupados[key].totalTransferencia += data.valorTransferencia;
            dadosAgrupados[key].totalTaxaAirbnb += data.taxaAirbnb;
            dadosAgrupados[key].totalFatura += data.valorTransferencia + data.taxaAirbnb;

            dadosAgrupados[key].detalhes.push(data);
        });

        // Ordenar dados
        const dadosOrdenados = Object.values(dadosAgrupados).sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            return b.mes - a.mes;
        });

        // Gerar HTML do relatório
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Ano</th>
                        <th>Mês</th>
                        <th>Total Transferência (€)</th>
                        <th>Total Taxa Airbnb (€)</th>
                        <th>Total Fatura (€)</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dadosOrdenados.forEach((item) => {
            const detalhesJson = encodeURIComponent(JSON.stringify(item.detalhes));
            html += `
                <tr>
                    <td>${item.ano}</td>
                    <td>${obterNomeMes(item.mes)}</td>
                    <td>€ ${item.totalTransferencia.toFixed(2)}</td>
                    <td>€ ${item.totalTaxaAirbnb.toFixed(2)}</td>
                    <td>€ ${item.totalFatura.toFixed(2)}</td>
                    <td>
                        <button onclick="mostrarDetalhes(this)" data-detalhes="${detalhesJson}">Ver Detalhes</button>
                        <button onclick="exportarPDF(${item.ano}, ${item.mes})">Exportar PDF</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        relatorioDiv.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar relatório de faturação: ", error);
        relatorioDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Função para carregar Relatório Modelo 30
async function carregarRelatorioModelo30() {
    const relatorioDiv = document.getElementById('relatorio-modelo30-conteudo');
    relatorioDiv.innerHTML = '<p>Carregando relatório...</p>';

    try {
        const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        const dadosAgrupados = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const key = `${data.ano}-${data.mes}`;
            if (!dadosAgrupados[key]) {
                dadosAgrupados[key] = {
                    ano: data.ano,
                    mes: data.mes,
                    totalTaxaAirbnb: 0,
                    detalhes: []
                };
            }

            dadosAgrupados[key].totalTaxaAirbnb += data.taxaAirbnb;
            dadosAgrupados[key].detalhes.push(data);
        });

        // Ordenar dados
        const dadosOrdenados = Object.values(dadosAgrupados).sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            return b.mes - a.mes;
        });

        // Gerar HTML do relatório
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Ano</th>
                        <th>Mês</th>
                        <th>Valor Total Taxa Airbnb (€)</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dadosOrdenados.forEach((item) => {
            const detalhesJson = encodeURIComponent(JSON.stringify(item.detalhes));
            html += `
                <tr>
                    <td>${item.ano}</td>
                    <td>${obterNomeMes(item.mes)}</td>
                    <td>€ ${item.totalTaxaAirbnb.toFixed(2)}</td>
                    <td>
                        <button onclick="mostrarDetalhesModelo30(this)" data-detalhes="${detalhesJson}">Ver Detalhes</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        relatorioDiv.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar relatório Modelo 30: ", error);
        relatorioDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Função para carregar Relatório Taxa Municipal Turística
async function carregarRelatorioTMT() {
    const relatorioDiv = document.getElementById('relatorio-tmt-conteudo');
    relatorioDiv.innerHTML = '<p>Carregando relatório...</p>';

    try {
        const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        const dadosPorApartamento = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const apt = data.apartamento;
            if (!dadosPorApartamento[apt]) {
                dadosPorApartamento[apt] = [];
            }
            dadosPorApartamento[apt].push(data);
        });

        let html = '';

        for (const [apartamento, dados] of Object.entries(dadosPorApartamento)) {
            html += `<h3>Apartamento ${apartamento}</h3>`;
            html += '<table>';
            html += '<tr><th>Ano</th><th>Mês</th><th>Estadias</th><th>Estadias Extra 7 dias</th><th>Estadias Crianças</th><th>Total Estadias</th><th>Ações</th></tr>';

            // Agrupar por Ano e Mês
            const dadosAgrupados = {};

            dados.forEach((item) => {
                const key = `${item.ano}-${item.mes}`;
                if (!dadosAgrupados[key]) {
                    dadosAgrupados[key] = {
                        ano: item.ano,
                        mes: item.mes,
                        estadias: 0,
                        estadiasExtra: 0,
                        estadiasCriancas: 0,
                        totalEstadias: 0,
                        detalhes: []
                    };
                }

                // Calcular Estadias
                const estadias = (item.valorPagoOperador + item.valorPagoDiretamente) / item.valorTmtPorNoite;
                dadosAgrupados[key].estadias += estadias;
                dadosAgrupados[key].estadiasExtra += item.noitesExtra;
                dadosAgrupados[key].estadiasCriancas += item.noitesCriancas;
                dadosAgrupados[key].totalEstadias += estadias + item.noitesExtra + item.noitesCriancas;
                dadosAgrupados[key].detalhes.push(item);
            });

            // Ordenar os grupos por Ano e Mês
            const chavesOrdenadas = Object.keys(dadosAgrupados).sort((a, b) => {
                const [anoA, mesA] = a.split('-').map(Number);
                const [anoB, mesB] = b.split('-').map(Number);
                if (anoA !== anoB) {
                    return anoA - anoB;
                }
                return mesA - mesB;
            });

            // Exibir os dados agrupados
            chavesOrdenadas.forEach((key) => {
                const grupo = dadosAgrupados[key];
                const nomeMes = obterNomeMes(grupo.mes);
                html += `<tr>
                            <td>${grupo.ano}</td>
                            <td>${nomeMes}</td>
                            <td>${Math.round(grupo.estadias)}</td>
                            <td>${grupo.estadiasExtra}</td>
                            <td>${grupo.estadiasCriancas}</td>
                            <td>${Math.round(grupo.totalEstadias)}</td>
                            <td><button onclick='mostrarDetalhesTMT(this)' data-detalhes='${encodeURIComponent(JSON.stringify(grupo.detalhes))}'>Ver Detalhes</button></td>
                         </tr>`;
            });
            html += '</table>';
        }

        relatorioDiv.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar relatório TMT: ", error);
        relatorioDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Função para obter o nome do mês
function obterNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[numeroMes - 1] || 'Mês Inválido';
}

// Função para mostrar/ocultar detalhes no Relatório de Faturação
window.mostrarDetalhes = function(button) {
    let detalhesDiv = button.nextElementSibling;
    if (detalhesDiv && detalhesDiv.classList.contains('detalhes')) {
        if (detalhesDiv.style.display === 'none') {
            detalhesDiv.style.display = 'block';
            button.textContent = 'Ocultar Detalhes';
        } else {
            detalhesDiv.style.display = 'none';
            button.textContent = 'Ver Detalhes';
        }
    } else {
        const detalhes = JSON.parse(decodeURIComponent(button.dataset.detalhes));
        let detailsHtml = "<div class='detalhes'><table><thead><tr><th>Número Fatura</th><th>Transferência (€)</th><th>Taxa Airbnb (€)</th><th>Total Fatura (€)</th></tr></thead><tbody>";
        detalhes.forEach((item) => {
            detailsHtml += `
                <tr>
                    <td>${item.numeroFatura}</td>
                    <td>€ ${item.valorTransferencia.toFixed(2)}</td>
                    <td>€ ${item.taxaAirbnb.toFixed(2)}</td>
                    <td>€ ${(item.valorTransferencia + item.taxaAirbnb).toFixed(2)}</td>
                </tr>`;
        });
        detailsHtml += "</tbody></table></div>";
        const div = document.createElement("div");
        div.classList.add('detalhes');
        div.style.display = 'block';
        div.innerHTML = detailsHtml;
        button.parentElement.appendChild(div);
        button.textContent = 'Ocultar Detalhes';
    }
}

// Função para mostrar/ocultar detalhes no Relatório Modelo 30
window.mostrarDetalhesModelo30 = function(button) {
    let detalhesDiv = button.nextElementSibling;
    if (detalhesDiv && detalhesDiv.classList.contains('detalhes')) {
        if (detalhesDiv.style.display === 'none') {
            detalhesDiv.style.display = 'block';
            button.textContent = 'Ocultar Detalhes';
        } else {
            detalhesDiv.style.display = 'none';
            button.textContent = 'Ver Detalhes';
        }
    } else {
        const detalhes = JSON.parse(decodeURIComponent(button.dataset.detalhes));
        let detailsHtml = "<div class='detalhes'><table><thead><tr><th>Data</th><th>Taxa Airbnb (€)</th></tr></thead><tbody>";
        detalhes.forEach((item) => {
            detailsHtml += `
                <tr>
                    <td>${new Date(item.timestamp.seconds * 1000).toLocaleDateString('pt-PT')}</td>
                    <td>€ ${item.taxaAirbnb.toFixed(2)}</td>
                </tr>`;
        });
        detailsHtml += "</tbody></table></div>";
        const div = document.createElement("div");
        div.classList.add('detalhes');
        div.style.display = 'block';
        div.innerHTML = detailsHtml;
        button.parentElement.appendChild(div);
        button.textContent = 'Ocultar Detalhes';
    }
}

// Função para mostrar/ocultar detalhes no Relatório TMT
window.mostrarDetalhesTMT = function(button) {
    let detalhesDiv = button.nextElementSibling;
    if (detalhesDiv && detalhesDiv.classList.contains('detalhes')) {
        if (detalhesDiv.style.display === 'none') {
            detalhesDiv.style.display = 'block';
            button.textContent = 'Ocultar Detalhes';
        } else {
            detalhesDiv.style.display = 'none';
            button.textContent = 'Ver Detalhes';
        }
    } else {
        const detalhes = JSON.parse(decodeURIComponent(button.dataset.detalhes));
        let detailsHtml = "<div class='detalhes'><table><thead><tr><th>Valor Pago Operador (€)</th><th>Valor Pago Diretamente (€)</th><th>Noites Extra 7 dias</th><th>Noites Crianças</th></tr></thead><tbody>";
        detalhes.forEach((item) => {
            detailsHtml += `
                <tr>
                    <td>€ ${item.valorPagoOperador.toFixed(2)}</td>
                    <td>€ ${item.valorPagoDiretamente.toFixed(2)}</td>
                    <td>${item.noitesExtra}</td>
                    <td>${item.noitesCriancas}</td>
                </tr>`;
        });
        detailsHtml += "</tbody></table></div>";
        const div = document.createElement("div");
        div.classList.add('detalhes');
        div.style.display = 'block';
        div.innerHTML = detailsHtml;
        button.parentElement.appendChild(div);
        button.textContent = 'Ocultar Detalhes';
    }
}

// Função para exportar PDF no Relatório de Faturação
window.exportarPDF = function(ano, mes) {
    // Aqui você pode implementar a lógica para gerar o PDF usando uma biblioteca como jsPDF
    alert(`Exportar PDF para ${obterNomeMes(mes)} de ${ano}`);
}
