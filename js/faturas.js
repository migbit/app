// Importar as funções necessárias do Firebase
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM Elements
const faturaForm = document.getElementById('fatura-form');
const relatorioFaturacaoDiv = document.getElementById('relatorio-faturacao');
const relatorioModelo30Div = document.getElementById('relatorio-modelo30');
const relatorioTmtDiv = document.getElementById('relatorio-tmt');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    definirValoresPadrao();
    carregarTodosRelatorios();
});

function definirValoresPadrao() {
    const hoje = new Date();
    document.getElementById('ano').value = hoje.getFullYear();
    document.getElementById('mes').value = hoje.getMonth() + 1;
}

// Event Listeners
faturaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        apartamento: document.getElementById('apartamento').value,
        ano: parseInt(document.getElementById('ano').value),
        mes: parseInt(document.getElementById('mes').value),
        numeroFatura: document.getElementById('numero-fatura').value,
        taxaAirbnb: parseFloat(document.getElementById('taxa-airbnb').value),
        valorTransferencia: parseFloat(document.getElementById('valor-transferencia').value),
        valorOperador: parseFloat(document.getElementById('valor-operador').value),
        noitesExtra: parseInt(document.getElementById('noites-extra').value) || 0,
        noitesCriancas: parseInt(document.getElementById('noites-criancas').value) || 0,
        valorDireto: parseFloat(document.getElementById('valor-direto').value) || 0,
        valorTmt: parseFloat(document.getElementById('valor-tmt').value),
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "faturas"), formData);
        alert('Fatura registrada com sucesso!');
        faturaForm.reset();
        definirValoresPadrao();
        carregarTodosRelatorios();
    } catch (error) {
        console.error("Erro ao registrar fatura:", error);
        alert('Ocorreu um erro ao registrar a fatura.');
    }
});

async function carregarTodosRelatorios() {
    const faturas = await carregarFaturas();
    gerarRelatorioFaturacao(faturas);
    gerarRelatorioModelo30(faturas);
    gerarRelatorioTMT(faturas);
}

async function carregarFaturas() {
    try {
        const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erro ao carregar faturas:", error);
        return [];
    }
}

function gerarRelatorioFaturacao(faturas) {
    const faturasAgrupadas = agruparPorAnoMes(faturas);
    let html = '<table><thead><tr><th>Ano</th><th>Mês</th><th>Fatura Nº</th><th>Valor Transferência</th><th>Taxa AirBnB</th><th>Total Fatura</th><th>Ações</th></tr></thead><tbody>';

    Object.entries(faturasAgrupadas).forEach(([key, grupo]) => {
        const [ano, mes] = key.split('-');
        const totalTransferencia = grupo.reduce((sum, f) => sum + f.valorTransferencia, 0);
        const totalTaxaAirbnb = grupo.reduce((sum, f) => sum + f.taxaAirbnb, 0);
        const totalFatura = totalTransferencia + totalTaxaAirbnb;

        html += `
            <tr>
                <td>${ano}</td>
                <td>${obterNomeMes(parseInt(mes))}</td>
                <td>${grupo.map(f => f.numeroFatura).join(', ')}</td>
                <td>€${totalTransferencia.toFixed(2)}</td>
                <td>€${totalTaxaAirbnb.toFixed(2)}</td>
                <td>€${totalFatura.toFixed(2)}</td>
                <td>
                    <button onclick="mostrarDetalhesFaturacao('${key}', this)" data-detalhes='${JSON.stringify(grupo).replace(/'/g, "\'")}'">Ver Detalhes</button>
                    <button onclick="exportarPDFFaturacao('${key}', '${JSON.stringify(grupo).replace(/'/g, "\'")}")">Exportar PDF</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    relatorioFaturacaoDiv.innerHTML = html;
}

function gerarRelatorioModelo30(faturas) {
    const faturasAgrupadas = agruparPorAnoMes(faturas);
    let html = '<table><thead><tr><th>Ano</th><th>Mês</th><th>Valor Total</th><th>Ações</th></tr></thead><tbody>';

    Object.entries(faturasAgrupadas).forEach(([key, grupo]) => {
        const [ano, mes] = key.split('-');
        const totalTaxaAirbnb = grupo.reduce((sum, f) => sum + f.taxaAirbnb, 0);

        html += `
            <tr>
                <td>${ano}</td>
                <td>${obterNomeMes(parseInt(mes))}</td>
                <td>€${totalTaxaAirbnb.toFixed(2)}</td>
                <td>
                    <button onclick="mostrarDetalhesModelo30('${key}', this)" data-detalhes='${JSON.stringify(grupo).replace(/'/g, "\'")}'">Ver Detalhes</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    relatorioModelo30Div.innerHTML = html;
}

function gerarRelatorioTMT(faturas) {
    const faturasAgrupadasPorTrimestre = agruparPorAnoTrimestreApartamento(faturas);
    let html = '';

    Object.entries(faturasAgrupadasPorTrimestre).forEach(([apartamento, trimestres]) => {
        html += `<h4>Apartamento ${apartamento}</h4>`;
        html += '<table><thead><tr><th>Ano</th><th>Trimestre</th><th>Estadias</th><th>Estadias Extra 7 Noites</th><th>Estadias Crianças</th><th>Total de Estadias</th><th>Ações</th></tr></thead><tbody>';

        Object.entries(trimestres).forEach(([keyTrimestre, dados]) => {
            const [ano, trimestre] = keyTrimestre.split('-');
            const estadias = Math.round((dados.valorOperador + dados.valorDireto) / dados.valorTmt);
            const totalEstadias = estadias + dados.noitesExtra + dados.noitesCriancas;

            html += `
                <tr>
                    <td>${ano}</td>
                    <td>${trimestre}º Trimestre</td>
                    <td>${estadias}</td>
                    <td>${dados.noitesExtra}</td>
                    <td>${dados.noitesCriancas}</td>
                    <td>${totalEstadias}</td>
                    <td>
                        <button onclick="mostrarDetalhesTMT('${apartamento}-${keyTrimestre}', this)" data-detalhes='${JSON.stringify(dados.detalhes).replace(/'/g, "\'")}'">Ver Detalhes</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
    });

    relatorioTmtDiv.innerHTML = html;
}

// Funções Auxiliares
function agruparPorAnoMes(faturas) {
    return faturas.reduce((grupos, fatura) => {
        const key = `${fatura.ano}-${fatura.mes}`;
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(fatura);
        return grupos;
    }, {});
}

function agruparPorAnoTrimestreApartamento(faturas) {
    return faturas.reduce((grupos, fatura) => {
        const trimestre = Math.ceil(fatura.mes / 3);
        const key = `${fatura.ano}-${trimestre}`;
        if (!grupos[fatura.apartamento]) grupos[fatura.apartamento] = {};
        if (!grupos[fatura.apartamento][key]) {
            grupos[fatura.apartamento][key] = {
                valorOperador: 0,
                valorDireto: 0,
                noitesExtra: 0,
                noitesCriancas: 0,
                valorTmt: fatura.valorTmt,
                detalhes: []
            };
        }
        grupos[fatura.apartamento][key].valorOperador += fatura.valorOperador;
        grupos[fatura.apartamento][key].valorDireto += fatura.valorDireto;
        grupos[fatura.apartamento][key].noitesExtra += fatura.noitesExtra;
        grupos[fatura.apartamento][key].noitesCriancas += fatura.noitesCriancas;
        grupos[fatura.apartamento][key].detalhes.push(fatura);
        return grupos;
    }, {});
}

function obterNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[numeroMes - 1] || 'Mês Inválido';
}

// Funções de Detalhes e Exportação
window.mostrarDetalhesFaturacao = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes);
    toggleDetalhes(button, gerarHTMLDetalhesFaturacao(detalhes));
}

window.mostrarDetalhesModelo30 = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes);
    toggleDetalhes(button, gerarHTMLDetalhesModelo30(detalhes));
}

window.mostrarDetalhesTMT = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes);
    toggleDetalhes(button, gerarHTMLDetalhesTMT(detalhes));
}

function toggleDetalhes(button, htmlContent) {
    let detalhesDiv = button.parentElement.querySelector('.detalhes');
    if (detalhesDiv) {
        if (detalhesDiv.style.display === 'none') {
            detalhesDiv.style.display = 'block';
            button.textContent = 'Ocultar Detalhes';
        } else {
            detalhesDiv.style.display = 'none';
            button.textContent = 'Ver Detalhes';
        }
    } else {
        detalhesDiv = document.createElement('div');
        detalhesDiv.className = 'detalhes';
        detalhesDiv.innerHTML = htmlContent;
        button.parentElement.appendChild(detalhesDiv);
        button.textContent = 'Ocultar Detalhes';
    }
}

function gerarHTMLDetalhesFaturacao(detalhes) {
    return `
        <table class="detalhes-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Fatura Nº</th>
                    <th>Valor Transferência</th>
                    <th>Taxa AirBnB</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${detalhes.map(d => `
                    <tr>
                        <td>${new Date(d.timestamp.seconds * 1000).toLocaleDateString()}</td>
                        <td>${d.numeroFatura}</td>
                        <td>€${d.valorTransferencia.toFixed(2)}</td>
                        <td>€${d.taxaAirbnb.toFixed(2)}</td>
                        <td>€${(d.valorTransferencia + d.taxaAirbnb).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function gerarHTMLDetalhesModelo30(detalhes) {
    return `
        <table class="detalhes-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Fatura Nº</th>
                    <th>Taxa AirBnB</th>
                </tr>
            </thead>
            <tbody>
                ${detalhes.map(d => `
                    <tr>
                        <td>${new Date(d.timestamp.seconds * 1000).toLocaleDateString()}</td>
                        <td>${d.numeroFatura}</td>
                        <td>€${d.taxaAirbnb.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function gerarHTMLDetalhesTMT(detalhes) {
    return `
        <table class="detalhes-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Valor Operador</th>
                    <th>Valor Direto</th>
                    <th>Noites Extra</th>
                    <th>Noites Crianças</th>
                    <th>Valor TMT</th>
                </tr>
            </thead>
            <tbody>
                ${detalhes.map(d => `
                    <tr>
                        <td>${new Date(d.timestamp.seconds * 1000).toLocaleDateString()}</td>
                        <td>€${d.valorOperador.toFixed(2)}</td>
                        <td>€${d.valorDireto.toFixed(2)}</td>
                        <td>${d.noitesExtra}</td>
                        <td>${d.noitesCriancas}</td>
                        <td>€${d.valorTmt.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.exportarPDFFaturacao = function(key, grupoJson) {
    // Validar se grupoJson é uma string válida ou um objeto
    let grupo;
    try {
        grupo = typeof grupoJson === 'string' ? JSON.parse(grupoJson) : grupoJson;
    } catch (e) {
        console.error('Erro ao processar JSON:', e);
        alert('Erro ao processar dados. Verifique se o formato está correto.');
        return;
    }

    // Verificar se grupo é um array
    if (!Array.isArray(grupo)) {
        console.error('O grupo deve ser um array');
        alert('Formato de dados inválido. É esperado um array de faturas.');
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js';
    script.onload = function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
       
        doc.text('Relatório de Faturação - ' + key, 10, 10);
        doc.text('Detalhes do Relatório:', 10, 20);
       
        let yPosition = 30;
        grupo.forEach((fatura, index) => {
            try {
                const faturaDetalhes = [
                    `Fatura Nº: ${fatura.numeroFatura || 'N/A'}`,
                    `Data: ${fatura.timestamp?.seconds ? new Date(fatura.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}`,
                    `Valor Transferência: €${(fatura.valorTransferencia || 0).toFixed(2)}`,
                    `Taxa AirBnB: €${(fatura.taxaAirbnb || 0).toFixed(2)}`,
                    `Total: €${((fatura.valorTransferencia || 0) + (fatura.taxaAirbnb || 0)).toFixed(2)}`
                ];
                
                faturaDetalhes.forEach((linha, lineIndex) => {
                    doc.text(linha, 10, yPosition + (lineIndex * 10));
                });
                yPosition += 50;
            } catch (e) {
                console.error(`Erro ao processar fatura ${index}:`, e);
                doc.text(`Erro ao processar fatura ${index}`, 10, yPosition);
                yPosition += 10;
            }
        });
        
        try {
            doc.save('relatorio-faturacao-' + key + '.pdf');
        } catch (e) {
            console.error('Erro ao salvar PDF:', e);
            alert('Erro ao gerar o PDF. Por favor, tente novamente.');
        }
    };
    
    script.onerror = function() {
        console.error('Erro ao carregar a biblioteca jsPDF');
        alert('Erro ao carregar o gerador de PDF. Por favor, verifique sua conexão e tente novamente.');
    };
    
    document.body.appendChild(script);
};

// Função auxiliar para teste
window.testarExportacao = function() {
    const dadosTeste = [
        {
            numeroFatura: "2024001",
            timestamp: { seconds: 1633046400 },
            valorTransferencia: 100.50,
            taxaAirbnb: 15.75
        }
    ];
    
    exportarPDFFaturacao('teste', JSON.stringify(dadosTeste));
};