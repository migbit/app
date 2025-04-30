// Importar as funções necessárias do Firebase
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM Elements
const faturaForm = document.getElementById('fatura-form');
const relatorioFaturacaoDiv = document.getElementById('relatorio-faturacao');
const relatorioModelo30Div   = document.getElementById('relatorio-modelo30');
const relatorioTmtDiv        = document.getElementById('relatorio-tmt');

// Estado global para filtragem de relatórios
let showPrevYears = false;
let selectedYear;
let faturasGlobal = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    definirValoresPadrao();
    await carregarTodosRelatorios();

    // Configurar filtro de ano e botão de toggle
    const btnToggle = document.getElementById('toggle-prev-year');
    const selYear  = document.getElementById('report-year');
    btnToggle.textContent = 'Mostrar anos anteriores';
    btnToggle.addEventListener('click', () => {
        showPrevYears = !showPrevYears;
        btnToggle.textContent = showPrevYears ? 'Ocultar anos anteriores' : 'Mostrar anos anteriores';
        reloadAllReports(faturasGlobal);
    });
    selYear.addEventListener('change', e => {
        selectedYear = parseInt(e.target.value, 10);
        reloadAllReports(faturasGlobal);
    });
});

// Já existente no teu ficheiro
function definirValoresPadrao() {
    const hoje = new Date();
    document.getElementById('ano').value = hoje.getFullYear();
    document.getElementById('mes').value = hoje.getMonth() + 1;
}

// Modificado: guarda em global e popula filtros
async function carregarTodosRelatorios() {
    faturasGlobal = await carregarFaturas();
    populateYearFilter(faturasGlobal);
    reloadAllReports(faturasGlobal);
}

// Mantém igual
async function carregarFaturas() {
    try {
        const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Erro ao carregar faturas:", error);
        return [];
    }
}

// Popula o <select> de anos disponíveis
function populateYearFilter(faturas) {
    const sel = document.getElementById('report-year');
    const anos = Array.from(new Set(faturas.map(f => f.ano))).sort((a,b) => b - a);
    sel.innerHTML = anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
    selectedYear = anos.includes(new Date().getFullYear())
                 ? new Date().getFullYear()
                 : anos[0];
    sel.value = selectedYear;
}

// Recarrega todos os relatórios (inclui a nova comparação)
function reloadAllReports(faturas) {
    gerarRelatorioFaturacao(faturas);
    gerarRelatorioModelo30(faturas);
    gerarRelatorioTMT(faturas);
    gerarComparacao(faturas);
}

// Relatório de Faturação, agora separado por apartamento e filtrado por ano
function gerarRelatorioFaturacao(faturas) {
    const arr = faturas.filter(f => showPrevYears || f.ano === selectedYear);
    const mesesData = {};
    arr.forEach(f => {
        const key = `${f.ano}-${f.mes}`;
        if (!mesesData[key]) {
            mesesData[key] = {
                ano: f.ano,
                mes: f.mes,
                apt: { '123': 0, '1248': 0 },
                total: 0,
                detalhes: []
            };
        }
        const valor = f.valorTransferencia + f.taxaAirbnb;
        mesesData[key].apt[f.apartamento] += valor;
        mesesData[key].total += valor;
        mesesData[key].detalhes.push(f);
    });

    let html = `<table>
      <thead>
        <tr>
          <th>Ano</th><th>Mês</th>
          <th>Apart. 123</th><th>Apart. 1248</th>
          <th>Total Geral</th><th>Ações</th>
        </tr>
      </thead>
      <tbody>`;

    Object.values(mesesData)
      .sort((a,b) => b.ano - a.ano || b.mes - a.mes)
      .forEach(d => {
        const mesNome    = obterNomeMes(d.mes);
        const detalhesJS = JSON.stringify(d.detalhes).replace(/"/g,'&quot;');
        html += `
          <tr data-year="${d.ano}">
            <td>${d.ano}</td>
            <td>${mesNome}</td>
            <td>€${d.apt['123'].toFixed(2)}</td>
            <td>€${d.apt['1248'].toFixed(2)}</td>
            <td>€${d.total.toFixed(2)}</td>
            <td>
              <button onclick="mostrarDetalhesFaturacao('${detalhesJS}', this)">
                Ver Detalhes
              </button>
            </td>
          </tr>`;
      });

    html += `</tbody></table>`;
    relatorioFaturacaoDiv.innerHTML = html;
}

// Relatório Modelo 30 — apenas filtra anos
function gerarRelatorioModelo30(faturas) {
    const arr = faturas.filter(f => showPrevYears || f.ano === selectedYear);
    const fAgr = agruparPorAnoMes(arr);

    let html = `<table>
      <thead>
        <tr><th>Ano</th><th>Mês</th><th>Valor Total</th><th>Ações</th></tr>
      </thead><tbody>`;

    Object.entries(fAgr).forEach(([key, grp]) => {
      const [ano, mes] = key.split('-');
      const totalTaxa = grp.reduce((s,f) => s + f.taxaAirbnb, 0);
      const grpJS     = JSON.stringify(grp).replace(/"/g,'&quot;');
      html += `
        <tr data-year="${ano}">
          <td>${ano}</td>
          <td>${obterNomeMes(parseInt(mes))}</td>
          <td>€${totalTaxa.toFixed(2)}</td>
          <td>
            <button onclick="mostrarDetalhesModelo30('${key}', this)" data-detalhes="${grpJS}">
              Ver Detalhes
            </button>
          </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    relatorioModelo30Div.innerHTML = html;
}

// Relatório TMT — também filtra anos
function gerarRelatorioTMT(faturas) {
    const arr = faturas.filter(f => showPrevYears || f.ano === selectedYear);
    const trimestres = agruparPorAnoTrimestreApartamento(arr);
    let html = '';

    Object.entries(trimestres).forEach(([apt, grupos]) => {
      html += `<h4>Apartamento ${apt}</h4>
        <table>
          <thead>
            <tr>
              <th>Ano</th><th>Trimestre</th><th>Estadias</th>
              <th>Extra 7 Noites</th><th>Crianças</th><th>Total</th><th>Ações</th>
            </tr>
          </thead><tbody>`;
      Object.entries(grupos).forEach(([key, d]) => {
        const [ano, tri] = key.split('-');
        const estadias   = Math.round((d.valorOperador + d.valorDireto)/d.valorTmt);
        const totEst     = estadias + d.noitesExtra + d.noitesCriancas;
        const detJS      = JSON.stringify(d.detalhes).replace(/"/g,'&quot;');
        html += `
          <tr data-year="${ano}">
            <td>${ano}</td>
            <td>${tri}º Trimestre</td>
            <td>${estadias}</td>
            <td>${d.noitesExtra}</td>
            <td>${d.noitesCriancas}</td>
            <td>${totEst}</td>
            <td>
              <button onclick="mostrarDetalhesTMT('${apt}-${key}', this)" data-detalhes="${detJS}">
                Ver Detalhes
              </button>
            </td>
          </tr>`;
      });
      html += `</tbody></table>`;
    });

    relatorioTmtDiv.innerHTML = html;
}

// Nova seção “Comparação”
function gerarComparacao(faturas) {
    const anoAtual = selectedYear;
    const anoAnt   = anoAtual - 1;
    const soma = (ano, apt) =>
      faturas
        .filter(f => f.ano === ano && f.apartamento === apt)
        .reduce((s,f) => s + f.valorTransferencia + f.taxaAirbnb, 0);

    const apts = ['123','1248'];
    let html = '';
    apts.forEach(apt => {
      const curr = soma(anoAtual, apt);
      const prev = soma(anoAnt, apt) || 1;
      const pct  = Math.round((curr/prev)*100);
      html += `
        <div class="comparacao-item">
          <strong>Apartamento ${apt}:</strong> €${curr.toFixed(2)} / €${prev.toFixed(2)}
          <div class="progress">
            <div class="progress-bar" style="width:${pct}%">${pct}%</div>
          </div>
        </div>`;
    });
    const totalCurr = apts.reduce((s,a) => s + soma(anoAtual,a), 0);
    const totalPrev = apts.reduce((s,a) => s + soma(anoAnt,a), 0) || 1;
    const pctTot    = Math.round((totalCurr/totalPrev)*100);
    html += `
      <div class="comparacao-item">
        <strong>Total Geral:</strong> €${totalCurr.toFixed(2)} / €${totalPrev.toFixed(2)}
        <div class="progress">
          <div class="progress-bar" style="width:${pctTot}%">${pctTot}%</div>
        </div>
      </div>`;

    document.getElementById('comparacao').innerHTML = html;
}

// ——————————————
// A partir daqui, todo o código existente (detalhes, exportação PDF, helpers)
// permanece exatamente igual ao que tinhas no ficheiro original.
// ——————————————


function gerarRelatorioModelo30(faturas) {
    const faturasAgrupadas = agruparPorAnoMes(faturas);
    let html = '<table><thead><tr><th>Ano</th><th>Mês</th><th>Valor Total</th><th>Ações</th></tr></thead><tbody>';

    Object.entries(faturasAgrupadas).forEach(([key, grupo]) => {
        const [ano, mes] = key.split('-');
        const totalTaxaAirbnb = grupo.reduce((sum, f) => sum + f.taxaAirbnb, 0);
        const grupoJSON = JSON.stringify(grupo).replace(/"/g, '&quot;');

        html += `
            <tr>
                <td>${ano}</td>
                <td>${obterNomeMes(parseInt(mes))}</td>
                <td>€${totalTaxaAirbnb.toFixed(2)}</td>
                <td>
                    <button onclick="mostrarDetalhesModelo30('${key}', this)" data-detalhes="${grupoJSON}">Ver Detalhes</button>
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
            const detalhesJSON = JSON.stringify(dados.detalhes).replace(/"/g, '&quot;');

            html += `
                <tr>
                    <td>${ano}</td>
                    <td>${trimestre}º Trimestre</td>
                    <td>${estadias}</td>
                    <td>${dados.noitesExtra}</td>
                    <td>${dados.noitesCriancas}</td>
                    <td>${totalEstadias}</td>
                    <td>
                        <button onclick="mostrarDetalhesTMT('${apartamento}-${keyTrimestre}', this)" data-detalhes="${detalhesJSON}">Ver Detalhes</button>
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
    const detalhes = JSON.parse(button.dataset.detalhes.replace(/&quot;/g, '"'));
    toggleDetalhes(button, gerarHTMLDetalhesFaturacao(detalhes));
}

window.mostrarDetalhesModelo30 = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes.replace(/&quot;/g, '"'));
    toggleDetalhes(button, gerarHTMLDetalhesModelo30(detalhes));
}

window.mostrarDetalhesTMT = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes.replace(/&quot;/g, '"'));
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
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js').then(jsPDFModule => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const grupo = JSON.parse(grupoJson);
        
        // Definir o título com o mês por extenso e centralizar
        const [ano, mes] = key.split('-');
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const titulo = `Relatório de Faturação - ${meses[mes - 1]} ${ano}`;
        doc.setFontSize(16);
        doc.text(titulo, 105, 15, { align: 'center' });

        // Cabeçalho da Tabela em negrito e centralizado
        let yPosition = 30;
        const xPositions = [2, 35, 80, 130, 170]; // Ajustado para começar mais perto da margem esquerda
        const colWidths = [40, 40, 40, 40, 40]; // Larguras das colunas
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");

        // Função para escrever texto centralizado
        function writeCenteredText(text, x, y, width) {
            const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
            const textX = x + (width - textWidth) / 2;
            doc.text(text, textX, y);
        }

        // Escrever cabeçalhos centralizados
        writeCenteredText('Fatura Nº', xPositions[0], yPosition, colWidths[0]);
        writeCenteredText('Data', xPositions[1], yPosition, colWidths[1]);
        writeCenteredText('Valor Transferência (€)', xPositions[2], yPosition, colWidths[2]);
        writeCenteredText('Taxa AirBnB (€)', xPositions[3], yPosition, colWidths[3]);
        writeCenteredText('Total (€)', xPositions[4], yPosition, colWidths[4]);

        yPosition += 10;

        // Dados das Faturas centralizados
        doc.setFont("helvetica", "normal");
        grupo.forEach(fatura => {
            writeCenteredText(fatura.numeroFatura, xPositions[0], yPosition, colWidths[0]);
            writeCenteredText(new Date(fatura.timestamp.seconds * 1000).toLocaleDateString(), xPositions[1], yPosition, colWidths[1]);
            writeCenteredText(`€${fatura.valorTransferencia.toFixed(2)}`, xPositions[2], yPosition, colWidths[2]);
            writeCenteredText(`€${fatura.taxaAirbnb.toFixed(2)}`, xPositions[3], yPosition, colWidths[3]);
            writeCenteredText(`€${(fatura.valorTransferencia + fatura.taxaAirbnb).toFixed(2)}`, xPositions[4], yPosition, colWidths[4]);
            yPosition += 10;
        });

        // Salvar o PDF
        doc.save(`relatorio-faturacao-${ano}-${meses[mes - 1]}.pdf`);
    }).catch(error => {
        console.error('Erro ao exportar PDF:', error);
    });
};