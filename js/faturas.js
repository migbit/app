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
        .reduce((s,f) => s + (f.valorTransferencia + f.taxaAirbnb), 0);
    }
  
    // 2) construir arrays mensais
    const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const data123   = labels.map((_, i) => somaPor(ultimoAno, i+1, '123'));
    const data1248  = labels.map((_, i) => somaPor(ultimoAno, i+1, '1248'));
    const dataTotal = labels.map((_, i) => data123[i] + data1248[i]);
  
    // comparativo Apt 123 vs Apt 1248
new Chart(document.getElementById('chart-comparacao-apt'), {
    type: 'bar',
    data: {
      labels, // meses Jan–Dez, já definidos acima
      datasets: [
        {
          label: 'Apartamento 123',
          data: data123,
          backgroundColor: 'blue'
        },
        {
          label: 'Apartamento 1248',
          data: data1248,
          backgroundColor: 'orange'
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
    const somaAno = ano => faturas
      .filter(f => f.ano === ano)
      .reduce((s,f) => s + (f.valorTransferencia + f.taxaAirbnb), 0);
  
    const totalAtual = somaAno(ultimoAno);
    const totalAnt   = somaAno(penultimoAno) || 1;
    const pctGanho   = Math.round((totalAtual / totalAnt) * 100);
  
    document.getElementById('progresso-anos').innerHTML = `
      <div class="comparacao-item">
        <strong>Acumulado ${penultimoAno}:</strong> €${totalAnt.toFixed(2)}
      </div>
      <div class="comparacao-item">
        <strong>Acumulado ${ultimoAno}:</strong> €${totalAtual.toFixed(2)}
        <div class="progress">
          <div class="progress-bar" style="width:${pctGanho}%">${pctGanho}%</div>
        </div>
      </div>
    `;
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
    apartamentos.forEach(apt => html += `<th>Apt ${apt}</th>`);
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
                .reduce((sum, f) => sum + (f.valorTransferencia + f.taxaAirbnb), 0);
            const mediaApt = somaApt / numMeses;
            somaTotal += somaApt;
            html += `<td>€${mediaApt.toFixed(2)}</td>`;
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