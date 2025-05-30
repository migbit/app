// Importar as funções necessárias do Firebase
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Dados manuais de faturação (substitua X e Y pelos valores reais que me fornecer)
const manualFaturasEstatica = [
      { ano: 2024, mes: 1, apartamento: '123', valorTransferencia: 1915.11, taxaAirbnb: 0 },
      { ano: 2024, mes: 1, apartamento: '1248', valorTransferencia: 3851, taxaAirbnb: 0 },
      { ano: 2024, mes: 2, apartamento: '123', valorTransferencia: 426, taxaAirbnb: 0 },
      { ano: 2024, mes: 2, apartamento: '1248', valorTransferencia: 1454, taxaAirbnb: 0 },
      { ano: 2024, mes: 3, apartamento: '123', valorTransferencia: 1310, taxaAirbnb: 0 },
      { ano: 2024, mes: 3, apartamento: '1248', valorTransferencia: 2678, taxaAirbnb: 0 },
      { ano: 2024, mes: 4, apartamento: '123', valorTransferencia: 4858.11, taxaAirbnb: 0 },
      { ano: 2024, mes: 4, apartamento: '1248', valorTransferencia: 6323, taxaAirbnb: 0 },
      { ano: 2024, mes: 5, apartamento: '123', valorTransferencia: 5680, taxaAirbnb: 0 },
      { ano: 2024, mes: 5, apartamento: '1248', valorTransferencia: 4806.61, taxaAirbnb: 0 },
      { ano: 2024, mes: 6, apartamento: '123', valorTransferencia: 4708.73, taxaAirbnb: 0 },
      { ano: 2024, mes: 6, apartamento: '1248', valorTransferencia: 6206, taxaAirbnb: 0 },
      { ano: 2024, mes: 7, apartamento: '123', valorTransferencia: 3659.04, taxaAirbnb: 0 },
      { ano: 2024, mes: 7, apartamento: '1248', valorTransferencia: 6015.30, taxaAirbnb: 0 },
      { ano: 2024, mes: 8, apartamento: '123', valorTransferencia: 5174, taxaAirbnb: 0 },
      { ano: 2024, mes: 8, apartamento: '1248', valorTransferencia: 7777, taxaAirbnb: 0 },
      { ano: 2024, mes: 9, apartamento: '123', valorTransferencia: 4599.41, taxaAirbnb: 0 },
      { ano: 2024, mes: 9, apartamento: '1248', valorTransferencia: 6780.52, taxaAirbnb: 0 },
    ];

    let showPrevFaturaYears = false;

// DOM Elements
const faturaForm = document.getElementById('fatura-form');
const relatorioFaturacaoDiv = document.getElementById('relatorio-faturacao');
const relatorioTmtDiv = document.getElementById('relatorio-tmt');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
        await definirValoresPadrao();
        carregarTodosRelatorios();
    });
    document
    .getElementById('toggle-prev-faturas')
    .addEventListener('click', () => {
      showPrevFaturaYears = !showPrevFaturaYears;
      document.getElementById('toggle-prev-faturas').textContent =
        showPrevFaturaYears ? 'Ocultar anos anteriores' : 'Mostrar anos anteriores';
      carregarTodosRelatorios();
    });
    
async function definirValoresPadrao() {
         const hoje = new Date();
         document.getElementById('ano').value = hoje.getFullYear();
         document.getElementById('mes').value = hoje.getMonth() + 1;
    
         // buscar a última fatura (por timestamp) e calcular próximo número
         const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"), limit(1));
         const snap = await getDocs(q);
         let proximo = "M1";
         if (!snap.empty) {
             const ultima = snap.docs[0].data().numeroFatura;           // ex: "M593"
             const num = parseInt(ultima.replace(/\D/g, ""), 10) + 1;   // 593 → 594
             proximo = `M${num}`;
         }
         document.getElementById('numero-fatura').value = proximo;
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
   const firebaseFaturas = await carregarFaturas();
   // junta Firebase + estático
   const faturas = firebaseFaturas.concat(manualFaturasEstatica);
    
    gerarRelatorioFaturacao(faturas);
    gerarRelatorioTMT(faturas);
    gerarAnaliseFaturacao(faturas);
    gerarMediaFaturacao(faturas);
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
    const currentYear = new Date().getFullYear();
    const arr = showPrevFaturaYears
      ? faturas
      : faturas.filter(f => f.ano === currentYear);
    const faturasAgrupadas = agruparPorAnoMes(arr);
    let html = '<table><thead><tr><th>Ano</th><th>Mês</th><th>Fatura Nº</th><th>Valor Transferência</th><th>Taxa AirBnB</th><th>Total Fatura</th><th>Ações</th></tr></thead><tbody>';

    Object.entries(faturasAgrupadas).forEach(([key, grupo]) => {
        const [ano, mes] = key.split('-');
        const totalTransferencia = grupo.reduce((sum, f) => sum + f.valorTransferencia, 0);
        const totalTaxaAirbnb = grupo.reduce((sum, f) => sum + f.taxaAirbnb, 0);
        const totalFatura = totalTransferencia + totalTaxaAirbnb;

        const grupoJSON = JSON.stringify(grupo).replace(/"/g, '&quot;');

        html += `
            <tr>
                <td>${ano}</td>
                <td>${obterNomeMes(parseInt(mes))}</td>
                <td>${grupo.map(f => f.numeroFatura).join(', ')}</td>
                <td>€${totalTransferencia.toFixed(2)}</td>
                <td>€${totalTaxaAirbnb.toFixed(2)}</td>
                <td>€${totalFatura.toFixed(2)}</td>
                <td>
                    <button onclick="mostrarDetalhesFaturacao('${key}', this)" data-detalhes="${grupoJSON}">Ver Detalhes</button>
                    <button onclick="exportarPDFFaturacao('${key}', '${grupoJSON}')">Exportar PDF</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    relatorioFaturacaoDiv.innerHTML = html;
}

function gerarRelatorioTMT(faturas) {
    const currentYear = new Date().getFullYear();
    const arr = showPrevFaturaYears
      ? faturas
      : faturas.filter(f => f.ano === currentYear);

    // agrupa por apartamento e trimestre, usando só o arr filtrado
    const faturasAgrupadasPorTrimestre = agruparPorAnoTrimestreApartamento(arr);

    let html = '';

    Object.entries(faturasAgrupadasPorTrimestre).forEach(([apartamento, trimestres]) => {
        html += `<h4>Apartamento ${apartamento}</h4>`;
        html += '<table><thead><tr>'
             +  '<th>Ano</th><th>Trimestre</th><th>Estadias</th>'
             +  '<th>Extra 7 Noites</th><th>Crianças</th><th>Total</th><th>Ações</th>'
             +  '</tr></thead><tbody>';

        Object.entries(trimestres).forEach(([keyTrimestre, dados]) => {
            const [ano, trimestre] = keyTrimestre.split('-');
            const estadias = Math.round((dados.valorOperador + dados.valorDireto) / dados.valorTmt);
            const totalEst = estadias + dados.noitesExtra + dados.noitesCriancas;
            const detalhesJSON = JSON.stringify(dados.detalhes).replace(/"/g, '&quot;');

            html += `
                <tr>
                    <td>${ano}</td>
                    <td>${trimestre}º</td>
                    <td>${estadias}</td>
                    <td>${dados.noitesExtra}</td>
                    <td>${dados.noitesCriancas}</td>
                    <td>${totalEst}</td>
                    <td>
                        <button onclick="mostrarDetalhesTMT('${apartamento}-${keyTrimestre}', this)"
                                data-detalhes="${detalhesJSON}">
                          Ver Detalhes
                        </button>
                    </td>
                </tr>`;
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

function gerarAnaliseFaturacao(faturas) {
    // 1) Prepara dados: meses 1–12, anos disponíveis (até ano atual)
    const anos = Array.from(new Set(faturas.map(f => f.ano))).sort();
    const ultimoAno = anos[anos.length - 1];
    const penultimoAno = anos[anos.length - 2] || ultimoAno - 1;
  
    // função auxiliar para somar valores por (ano, mes, apt)
    function somaPor(ano, mes, apt) {
      return faturas
        .filter(f => f.ano === ano && f.mes === mes && f.apartamento === apt)
        .reduce((s,f) => s + f.valorTransferencia, 0);
    }
  
    // 2) construir arrays mensais
    const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const data123   = labels.map((_, i) => somaPor(ultimoAno, i+1, '123'));
    const data1248  = labels.map((_, i) => somaPor(ultimoAno, i+1, '1248'));
    const dataTotal = labels.map((_, i) => data123[i] + data1248[i]);
    // ── Novo: calculamos também o ano anterior ──
    const data123Prev  = labels.map((_, i) => somaPor(penultimoAno, i+1, '123'));
    const data1248Prev = labels.map((_, i) => somaPor(penultimoAno, i+1, '1248'));

   // comparativo Apt 123 e 1248: ano anterior (transparente) vs ano atual (sólido)
 new Chart(document.getElementById('chart-comparacao-apt'), {
   type: 'bar',
   data: {
     labels,
     datasets: [
       {
         label: `Apt 123 ${penultimoAno}`,
         data: data123Prev,
         backgroundColor: 'rgba(54,162,235,0.4)'  // último ano, tom suave
       },
       {
         label: `Apt 123 ${ultimoAno}`,
         data: data123,
         backgroundColor: 'rgba(54,162,235,1)'   // ano atual, sólido
       },
       {
         label: `Apt 1248 ${penultimoAno}`,
         data: data1248Prev,
         backgroundColor: 'rgba(245, 133, 20, 0.4)'
       },
       {
         label: `Apt 1248 ${ultimoAno}`,
         data: data1248,
         backgroundColor: 'rgba(245, 133, 20,1)'
       }
     ]
   },
   options: {
     responsive: true,
     scales: {
       y: { beginAtZero: true }
     }
   }
 });
  
    new Chart(document.getElementById('chart-total'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: `Total ${penultimoAno}`, data: labels.map((_, i) => somaPor(penultimoAno, i+1, '123') + somaPor(penultimoAno, i+1, '1248')), borderDash: [5,5] },
          { label: `Total ${ultimoAno}`,   data: dataTotal }
        ],
      },
      options: { responsive: true }
    });
  
    
  // 4) Barras de progresso: acumulado ano vs ano anterior
  const somaAno = (ano, apt = null) => faturas
  .filter(f => f.ano === ano && (!apt || f.apartamento === apt))
  .reduce((s,f) => s + f.valorTransferencia, 0);

  // 4) Barras de progresso: totais gerais e por apartamento
  const apartamentos = Array.from(new Set(faturas.map(f => f.apartamento))).sort();

  // ─── totais acumulados em tabela ───
  const sumCurr123   = somaAno(ultimoAno, '123');
  const sumCurr1248  = somaAno(ultimoAno, '1248');
  const totalAcumAtual = sumCurr123 + sumCurr1248;

  const sumPrev123   = somaAno(penultimoAno, '123');
  const sumPrev1248   = somaAno(penultimoAno, '1248');
  const totalPrevAno  = sumPrev123 + sumPrev1248;

  let htmlProg = `
    <table class="media-faturacao">
      <thead>
        <tr>
          <th>Ano</th>
          <th class="apt-123">123</th>
          <th class="apt-1248">1248</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${ultimoAno}</td>
          <td class="apt-123">€${sumCurr123.toFixed(2)}</td>
          <td class="apt-1248">€${sumCurr1248.toFixed(2)}</td>
          <td>€${totalAcumAtual.toFixed(2)}</td>
        </tr>
        <tr>
          <td>${penultimoAno}</td>
          <td class="apt-123">€${sumPrev123.toFixed(2)}</td>
          <td class="apt-1248">€${sumPrev1248.toFixed(2)}</td>
          <td>€${totalPrevAno.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
    <hr class="divider">
  `;

  // 1) comparação por apartamento vs todos os anos anteriores
  apartamentos.forEach(apt => {
    const atual = somaAno(ultimoAno, apt);
    const antes = faturas
      .filter(f => f.apartamento === apt && f.ano < ultimoAno)
      .reduce((s,f) => s + f.valorTransferencia, 0) || 1;

    const diff    = antes - atual;
    const pct     = Math.round(Math.abs(diff) / antes * 100);
    const labelPct= diff > 0 ? `-${pct}%` : `+${pct}%`;
    const barCol  = diff > 0 ? '#dc3545' : '#28a745';
    const label   = diff > 0
                      ? `Faltam €${diff.toFixed(2)}`
                      : `Excedeu €${(-diff).toFixed(2)}`;

    htmlProg += `
      <div class="comparacao-item">
        <strong>Apt ${apt} ${ultimoAno} vs ${penultimoAno}:</strong>
        <span style="color:${barCol}; margin-left:0.5rem;">${label}</span>
        <div class="progress" style="background:#e9ecef; height:1.5rem; margin-top:0.5rem;">
          <div class="progress-bar"
               style="width:${pct}%; background:${barCol}; display:flex;align-items:center;justify-content:center;">
            ${labelPct}
          </div>
        </div>
      </div>`;
  });

  // 2) total combinado vs todos os anos anteriores
  (() => {
    const diffT     = totalPrevAno - totalAcumAtual;
    const pctT      = Math.round(Math.abs(diffT) / totalPrevAno * 100);
    const labelPctT = diffT > 0 ? `-${pctT}%` : `+${pctT}%`;
    const barColT   = diffT > 0 ? '#dc3545' : '#28a745';
    const labelT    = diffT > 0
                        ? `Faltam €${diffT.toFixed(2)}`
                        : `Excedeu €${(-diffT).toFixed(2)}`;

    htmlProg += `
      <hr class="divider">
      <div class="comparacao-item">
        <strong>Total ${ultimoAno} vs ${penultimoAno}:</strong>
        <span style="color:${barColT}; margin-left:0.5rem;">${labelT}</span>
        <div class="progress" style="background:#e9ecef; height:1.5rem; margin-top:0.5rem;">
          <div class="progress-bar"
               style="width:${pctT}%; background:${barColT}; display:flex;align-items:center;justify-content:center;">
            ${labelPctT}
          </div>
        </div>
      </div>`;
  })();

  // 3) comparativo até mês anterior por apt + total
  const currentMonth = new Date().getMonth() + 1;
  const nomeMes      = obterNomeMes(currentMonth - 1);
  htmlProg += `<hr class="divider"><strong>Comparativo até ${nomeMes}:</strong>`;

  apartamentos.forEach(apt => {
    const curA = faturas
      .filter(f => f.ano === ultimoAno && f.apartamento === apt && f.mes < currentMonth)
      .reduce((s,f) => s + f.valorTransferencia, 0);
    const antA = faturas
      .filter(f => f.apartamento === apt && f.ano < ultimoAno && f.mes < currentMonth)
      .reduce((s,f) => s + f.valorTransferencia, 0) || 1;

    const diffA    = antA - curA;
    const pctA     = Math.round(Math.abs(diffA) / antA * 100);
    const labelPctA= diffA > 0 ? `-${pctA}%` : `+${pctA}%`;
    const barColA  = diffA > 0 ? '#dc3545' : '#28a745';
    const labelA   = diffA > 0
                       ? `Faltam €${diffA.toFixed(2)}`
                       : `Excedeu €${(-diffA).toFixed(2)}`;

    htmlProg += `
      <div class="comparacao-item">
        <strong>Apt ${apt} até ${nomeMes}:</strong>
        <span style="color:${barColA}; margin-left:0.5rem;">${labelA}</span>
        <div class="progress" style="background:#e9ecef; height:1.5rem; margin-top:0.5rem;">
          <div class="progress-bar"
               style="width:${pctA}%; background:${barColA}; display:flex;align-items:center;justify-content:center;">
            ${labelPctA}
          </div>
        </div>
      </div>`;
  });

  (() => {
    const curT2 = faturas
      .filter(f => f.ano === ultimoAno && f.mes < currentMonth)
      .reduce((s,f) => s + f.valorTransferencia, 0);
    const antT2 = faturas
      .filter(f => f.ano < ultimoAno && f.mes < currentMonth)
      .reduce((s,f) => s + f.valorTransferencia, 0) || 1;

    const diffT2    = antT2 - curT2;
    const pctT2     = Math.round(Math.abs(diffT2) / antT2 * 100);
    const labelPctT2= diffT2 > 0 ? `-${pctT2}%` : `+${pctT2}%`;
    const barColT2  = diffT2 > 0 ? '#dc3545' : '#28a745';
    const labelT2   = diffT2 > 0
                       ? `Faltam €${diffT2.toFixed(2)}`
                       : `Excedeu €${(-diffT2).toFixed(2)}`;

    htmlProg += `
      <hr class="divider">
      <div class="comparacao-item">
        <strong>Total até ${nomeMes}:</strong>
        <span style="color:${barColT2}; margin-left:0.5rem;">${labelT2}</span>
        <div class="progress" style="background:#e9ecef; height:1.5rem; margin-top:0.5rem;">
          <div class="progress-bar"
               style="width:${pctT2}%; background:${barColT2}; display:flex;align-items:center;justify-content:center;">
            ${labelPctT2}
          </div>
        </div>
      </div>`;
  })();

document.getElementById('progresso-anos').innerHTML = htmlProg;
}

  // Função: gerar média mensal por ano e apartamento
function gerarMediaFaturacao(faturas) {
    // Identificar anos disponíveis
    const anos = Array.from(new Set(faturas.map(f => f.ano))).sort();
    // Identificar apartamentos disponíveis
    const apartamentos = Array.from(new Set(faturas.map(f => f.apartamento))).sort();

    // Construir tabela HTML
let html = '<h4>Média Mensal de Receita</h4>';
html += '<table class="media-faturacao"><thead><tr><th>Ano</th>';
apartamentos.forEach(apt => {
    html += `<th class="apt-${apt}">Apt ${apt}</th>`;
});
html += '<th>Total</th></tr></thead><tbody>';

anos.forEach(ano => {
    const faturasAno = faturas.filter(f => f.ano === ano);
    const mesesAno = Array.from(new Set(faturasAno.map(f => f.mes)));
    const numMeses = mesesAno.length || 1;

    let somaTotal = 0;
    html += `<tr><td>${ano}</td>`;
    apartamentos.forEach(apt => {
        const somaApt = faturasAno
            .filter(f => f.apartamento === apt)
            .reduce((sum, f) => sum + f.valorTransferencia, 0);
        const mediaApt = somaApt / numMeses;
        somaTotal += somaApt;
        html += `<td class="apt-${apt}">€${mediaApt.toFixed(2)}</td>`;
    });
    const mediaTotal = somaTotal / numMeses;
    html += `<td>€${mediaTotal.toFixed(2)}</td></tr>`;
});

html += '</tbody></table>';

    // Inserir no container existente ou criar um novo
    let container = document.getElementById('media-faturacao');
    if (!container) {
        container = document.createElement('div');
        container.id = 'media-faturacao';
        document
          .getElementById('analise-faturacao-container')
          .appendChild(container);
    }
    container.innerHTML = html;
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
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js')
      .then(jsPDFModule => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const grupo = JSON.parse(grupoJson);

        // Definir o título
        const [ano, mes] = key.split('-');
        const meses = [
          'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
          'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
        ];
        const titulo = `Relatório de Faturação - ${meses[mes - 1]} ${ano}`;
        doc.setFontSize(16);
        doc.text(titulo, 105, 15, { align: 'center' });

        // Preparar cabeçalho de 7 colunas
        const headers = [
          'Fatura Nº',
          'Data',
          'Valor Transferência (€)',
          'Taxa AirBnB (€)',
          'Valor Base (€)',
          'IVA (€)',
          'Total (€)'
        ];
        const xPositions = [2, 32, 62, 92, 122, 152, 182];
        const colWidths =   [30, 30, 30, 30, 30, 30, 30];

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        let y = 30;

        function writeCentered(text, x, y, w) {
          const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
          const offsetX = x + (w - textWidth) / 2;
          doc.text(text, offsetX, y);
        }

        // Cabeçalhos
        headers.forEach((h, i) => writeCentered(h, xPositions[i], y, colWidths[i]));
        y += 10;

        // Linhas de dados
        doc.setFont('helvetica', 'normal');
        let sumTransfer = 0, sumTaxa = 0, sumBase = 0, sumIVA = 0, sumTotal = 0;

        grupo.forEach(f => {
          const dataStr = new Date(f.timestamp.seconds * 1000).toLocaleDateString();
          const vb = f.valorTransferencia / 1.06;
          const iva = f.valorTransferencia - vb;
          const tot = f.valorTransferencia + f.taxaAirbnb;

          // Acumula totais
          sumTransfer += f.valorTransferencia;
          sumTaxa     += f.taxaAirbnb;
          sumBase     += vb;
          sumIVA      += iva;
          sumTotal    += tot;

          const vals = [
            f.numeroFatura,
            dataStr,
            `€${f.valorTransferencia.toFixed(2)}`,
            `€${f.taxaAirbnb.toFixed(2)}`,
            `€${vb.toFixed(2)}`,
            `€${iva.toFixed(2)}`,
            `€${tot.toFixed(2)}`
          ];
          vals.forEach((txt, i) => writeCentered(txt, xPositions[i], y, colWidths[i]));
          y += 10;
        });

        // Linha de totais
        doc.setFont('helvetica', 'bold');
        writeCentered('Totais',      xPositions[0], y, colWidths[0]);
        writeCentered('',            xPositions[1], y, colWidths[1]);
        writeCentered(`€${sumTransfer.toFixed(2)}`, xPositions[2], y, colWidths[2]);
        writeCentered(`€${sumTaxa.toFixed(2)}`,     xPositions[3], y, colWidths[3]);
        writeCentered(`€${sumBase.toFixed(2)}`,     xPositions[4], y, colWidths[4]);
        writeCentered(`€${sumIVA.toFixed(2)}`,      xPositions[5], y, colWidths[5]);
        writeCentered(`€${sumTotal.toFixed(2)}`,    xPositions[6], y, colWidths[6]);

        // Salvar PDF
        doc.save(`relatorio-faturacao-${ano}-${meses[mes - 1]}.pdf`);
      })
      .catch(error => {
        console.error('Erro ao exportar PDF:', error);
      });
};
