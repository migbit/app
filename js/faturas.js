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
    setupReportFilters();
});

// Define valores padrão no form de inserção
function definirValoresPadrao() {
    const hoje = new Date();
    const anoInput = document.getElementById('ano');
    const mesInput = document.getElementById('mes');
    if (anoInput) anoInput.value = hoje.getFullYear();
    if (mesInput) mesInput.value = hoje.getMonth() + 1;
}

// Carrega faturas, popula filtros e gera relatórios
async function carregarTodosRelatorios() {
    faturasGlobal = await carregarFaturas();
    populateYearFilter(faturasGlobal);
    reloadAllReports(faturasGlobal);
}

// Busca faturas do Firestore
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

// Configura o botão de toggle e o seletor de ano
function setupReportFilters() {
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
}

// Popula <select id="report-year"> com os anos disponíveis
function populateYearFilter(faturas) {
    const sel = document.getElementById('report-year');
    const anos = Array.from(new Set(faturas.map(f => f.ano))).sort((a,b) => b - a);
    sel.innerHTML = anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
    const hojeAno = new Date().getFullYear();
    selectedYear = anos.includes(hojeAno) ? hojeAno : (anos[0] || hojeAno);
    sel.value = selectedYear;
}

// Recarrega todos os relatórios
function reloadAllReports(faturas) {
    gerarRelatorioFaturacao(faturas);
    gerarRelatorioModelo30(faturas);
    gerarRelatorioTMT(faturas);
    gerarComparacao(faturas);
}

// ——— Relatório de Faturação ———
function gerarRelatorioFaturacao(faturas) {
    const arr = faturas.filter(f => showPrevYears || f.ano === selectedYear);
    const mesesData = {};
    arr.forEach(f => {
        const key = `${f.ano}-${f.mes}`;
        if (!mesesData[key]) {
            mesesData[key] = { ano: f.ano, mes: f.mes, apt: { '123': 0, '1248': 0 }, total: 0, detalhes: [] };
        }
        const valor = (f.valorTransferencia || 0) + (f.taxaAirbnb || 0);
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
        const mesNome = obterNomeMes(d.mes);
        const detalhesJSON = JSON.stringify(d.detalhes).replace(/\"/g, '&quot;');
        html += `
          <tr data-year="${d.ano}">
            <td>${d.ano}</td>
            <td>${mesNome}</td>
            <td>€${d.apt['123'].toFixed(2)}</td>
            <td>€${d.apt['1248'].toFixed(2)}</td>
            <td>€${d.total.toFixed(2)}</td>
            <td>
              <button onclick="mostrarDetalhesFaturacao('${detalhesJSON}', this)">Ver Detalhes</button>
              <button onclick="exportarPDFFaturacao('${d.ano}-${d.mes}', '${detalhesJSON}')">Exportar PDF</button>
            </td>
          </tr>`;
      });

    html += `</tbody></table>`;
    relatorioFaturacaoDiv.innerHTML = html;
}

// ——— Relatório Modelo 30 ———
function gerarRelatorioModelo30(faturas) {
    const arr = faturas.filter(f => showPrevYears || f.ano === selectedYear);
    const fAgr = agruparPorAnoMes(arr);
    let html = `<table>
      <thead>
        <tr><th>Ano</th><th>Mês</th><th>Valor Total</th><th>Ações</th></tr>
      </thead>
      <tbody>`;

    Object.entries(fAgr)
      .sort((a,b) => {
        const [aAno,aMes] = a[0].split('-').map(Number);
        const [bAno,bMes] = b[0].split('-').map(Number);
        return bAno - aAno || bMes - aMes;
      })
      .forEach(([key, grupo]) => {
        const [ano, mes] = key.split('-').map(Number);
        const totalTaxa = grupo.reduce((s,f) => s + (f.taxaAirbnb || 0), 0);
        const grpJSON    = JSON.stringify(grupo).replace(/\"/g, '&quot;');
        html += `
          <tr data-year="${ano}">
            <td>${ano}</td>
            <td>${obterNomeMes(mes)}</td>
            <td>€${totalTaxa.toFixed(2)}</td>
            <td><button onclick="mostrarDetalhesModelo30('${grpJSON}', this)">Ver Detalhes</button></td>
          </tr>`;
      });

    html += `</tbody></table>`;
    relatorioModelo30Div.innerHTML = html;
}

// ——— Relatório TMT ———
function gerarRelatorioTMT(faturas) {
    const arr = faturas.filter(f => showPrevYears || f.ano === selectedYear);
    const tmtData = agruparPorAnoTrimestreApartamento(arr);
    let html = '';

    Object.entries(tmtData).forEach(([apt, grupos]) => {
      html += `<h4>Apartamento ${apt}</h4>
        <table>
          <thead>
            <tr>
              <th>Ano</th><th>Trimestre</th><th>Estadias</th><th>Extra 7 Noites</th><th>Crianças</th><th>Total</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>`;
      Object.entries(grupos)
        .sort((a,b) => {
          const [aAno,aTri] = a[0].split('-').map(Number);
          const [bAno,bTri] = b[0].split('-').map(Number);
          return bAno - aAno || bTri - aTri;
        })
        .forEach(([key, d]) => {
          const [ano, tri] = key.split('-');
          const estadias   = Math.round((d.valorOperador + d.valorDireto) / d.valorTmt);
          const totalEst   = estadias + d.noitesExtra + d.noitesCriancas;
          const detJSON    = JSON.stringify(d.detalhes).replace(/\"/g, '&quot;');
          html += `
            <tr data-year="${ano}">
              <td>${ano}</td>
              <td>${tri}º Trimestre</td>
              <td>${estadias}</td>
              <td>${d.noitesExtra}</td>
              <td>${d.noitesCriancas}</td>
              <td>${totalEst}</td>
              <td><button onclick="mostrarDetalhesTMT('${detJSON}', this)">Ver Detalhes</button></td>
            </tr>`;
        });
      html += `</tbody></table>`;
    });

    relatorioTmtDiv.innerHTML = html;
}

// ——— Nova Seção Comparação ———
function gerarComparacao(faturas) {
    const anoAtual = selectedYear;
    const anoAnt   = anoAtual - 1;
    const soma = (ano, apt) =>
      faturas
        .filter(f => f.ano === ano && f.apartamento === apt)
        .reduce((s,f) => s + ((f.valorTransferencia || 0) + (f.taxaAirbnb || 0)), 0);

    const apts = ['123','1248'];
    let html = '';
    apts.forEach(apt => {
      const curr = soma(anoAtual, apt);
      const prev = soma(anoAnt, apt) || 1;
      const pct  = Math.round((curr / prev) * 100);
      html += `<div class=\"comparacao-item\">` +
              `<strong>Apartamento ${apt}:</strong> €${curr.toFixed(2)} / €${prev.toFixed(2)}` +
              `<div class=\"progress\"><div class=\"progress-bar\" style=\"width:${pct}%\">${pct}%</div></div>` +
              `</div>`;
    });
    const totalCurr = apts.reduce((s,a) => s + soma(anoAtual,a), 0);
    const totalPrev = apts.reduce((s,a) => s + soma(anoAnt,a), 0) || 1;
    const pctTot    = Math.round((totalCurr / totalPrev) * 100);
    html += `<div class=\"comparacao-item\">` +
            `<strong>Total Geral:</strong> €${totalCurr.toFixed(2)} / €${totalPrev.toFixed(2)}` +
            `<div class=\"progress\"><div class=\"progress-bar\" style=\"width:${pctTot}%\">${pctTot}%</div></div>` +
            `</div>`;
    document.getElementById('comparacao').innerHTML = html;
}

// ——— Helpers ———
function agruparPorAnoMes(faturas) {
    return faturas.reduce((acc, f) => {
        const key = `${f.ano}-${f.mes}`;
        (acc[key] = acc[key] || []).push(f);
        return acc;
    }, {});
}

function agruparPorAnoTrimestreApartamento(faturas) {
    return faturas.reduce((grupos, f) => {
        const tri = Math.ceil(f.mes / 3);
        const key = `${f.ano}-${tri}`;
        if (!grupos[f.apartamento]) grupos[f.apartamento] = {};
        if (!grupos[f.apartamento][key]) {
            grupos[f.apartamento][key] = { valorOperador: 0, valorDireto: 0, noitesExtra: 0, noitesCriancas: 0, valorTmt: f.valorTmt, detalhes: [] };
        }
        grupos[f.apartamento][key].valorOperador += (f.valorOperador || 0);
        grupos[f.apartamento][key].valorDireto  += (f.valorDireto || 0);
        grupos[f.apartamento][key].noitesExtra  += (f.noitesExtra || 0);
        grupos[f.apartamento][key].noitesCriancas+= (f.noitesCriancas || 0);
        grupos[f.apartamento][key].detalhes.push(f);
        return grupos;
    }, {});
}

function obterNomeMes(numeroMes) {
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return meses[numeroMes - 1] || '';
}

// ——— Funções de Detalhes e Exportação ———
window.mostrarDetalhesFaturacao = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes.replace(/&quot;/g, '"'));
    toggleDetalhes(button, gerarHTMLDetalhesFaturacao(detalhes));
};

window.mostrarDetalhesModelo30 = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes.replace(/&quot;/g, '"'));
    toggleDetalhes(button, gerarHTMLDetalhesModelo30(detalhes));
};

window.mostrarDetalhesTMT = function(key, button) {
    const detalhes = JSON.parse(button.dataset.detalhes.replace(/&quot;/g, '"'));
    toggleDetalhes(button, gerarHTMLDetalhesTMT(detalhes));
};

window.exportarPDFFaturacao = function(key, grupoJson) {
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js')
      .then(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const grupo = JSON.parse(grupoJson);
        const [ano, mes] = key.split('-').map(Number);
        const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const titulo = `Relatório de Faturação - ${meses[mes-1]} ${ano}`;
        doc.setFontSize(16);
        doc.text(titulo, 105, 15, { align: 'center' });

        const xPositions = [15, 60, 105, 150, 195];
        const colLabels = ['Nº Fatura', 'Data', 'Transferência', 'Taxa', 'Total'];
        doc.setFont('helvetica', 'bold');
        colLabels.forEach((label, i) => {
          doc.text(label, xPositions[i], 30);
        });

        doc.setFont('helvetica', 'normal');
        let yPos = 40;
        grupo.forEach(f => {
          doc.text(f.numeroFatura, xPositions[0], yPos);
          doc.text(new Date(f.timestamp.seconds * 1000).toLocaleDateString(), xPositions[1], yPos);
          doc.text(`€${f.valorTransferencia.toFixed(2)}`, xPositions[2], yPos);
          doc.text(`€${f.taxaAirbnb.toFixed(2)}`, xPositions[3], yPos);
          doc.text(`€${(f.valorTransferencia + f.taxaAirbnb).toFixed(2)}`, xPositions[4], yPos);
          yPos += 10;
        });

        doc.save(`relatorio-faturacao-${ano}-${meses[mes-1]}.pdf`);
      })
      .catch(error => {
        console.error('Erro ao exportar PDF:', error);
      });
};
