// js/caixa.js

// Importar Firestore
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Elementos do DOM
const caixaForm    = document.getElementById('caixa-form');
const btnEntrada   = document.getElementById('btn-entrada');
const btnSaida     = document.getElementById('btn-saida');
const tipoInput    = document.getElementById('tipo');

const selectCaixa  = document.getElementById('caixa');      // dropdown Banco/Direita/Esquerda
const checkboxP    = document.getElementById('marcar-p');   // checkbox "P"
const pGroup       = document.querySelector('.form-group.checkbox'); // grupo do "P"

// Mostrar/ocultar o “P” consoante a caixa
function togglePVisibility() {
  const show = selectCaixa.value !== 'banco';
  if (pGroup) pGroup.style.display = show ? 'grid' : 'none';
  if (!show && checkboxP) checkboxP.checked = false;
}
selectCaixa.addEventListener('change', togglePVisibility);

// Botões Entrada/Saída (exclusivos)
btnEntrada.addEventListener('click', () => setTipoTransacao('Entrada'));
btnSaida.addEventListener('click',   () => setTipoTransacao('Saída'));

function setTipoTransacao(tipo) {
  tipoInput.value = tipo;
  btnEntrada.classList.toggle('btn-active', tipo === 'Entrada');
  btnSaida.classList.toggle('btn-active',   tipo === 'Saída');
}

// Formatação numérica
function formatNumber(number) {
  return number.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'decimal' });
}

// Submeter transação
caixaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipo  = tipoInput.value;
  const valor = parseFloat(document.getElementById('valor').value);
  const caixa = selectCaixa.value;           // banco | direita | esquerda
  const marcarP = checkboxP?.checked ?? false;

  if (!tipo || isNaN(valor) || valor <= 0) {
    alert('Por favor, selecione um tipo de transação e insira um valor válido.');
    return;
  }

  try {
    const docData = {
      tipo,
      valor: tipo === 'Entrada' ? valor : -valor,
      caixa,                           // identifica a caixa
      timestamp: new Date()
    };
    // Só guardar "P" para Direita/Esquerda
    if (caixa !== 'banco') docData.marcarP = marcarP;

    await addDoc(collection(db, 'caixa'), docData);
    alert('Transação registada com sucesso!');
    caixaForm.reset();
    setTipoTransacao('');
    togglePVisibility();               // volta a esconder "P" se o default do select for Banco
    carregarRelatorio();
  } catch (e) {
    console.error('Erro ao registar transação: ', e);
    alert('Ocorreu um erro ao registar a transação.');
  }
});

// Carregar relatório para as três caixas
async function carregarRelatorio() {
  const elBanco    = document.getElementById('caixa-banco');
  const elDireita  = document.getElementById('caixa-direita');
  const elEsquerda = document.getElementById('caixa-esquerda');

  [elBanco, elDireita, elEsquerda].forEach(el => { if (el) el.innerHTML = '<p>A carregar…</p>'; });

  try {
    const q  = query(collection(db, 'caixa'), orderBy('timestamp', 'desc'));
    const qs = await getDocs(q);

    // Estrutura de acumulação: Banco simples; Direita/Esquerda divididas por P vs Sem P
    const caixas = {
      banco:   { transacoes: [], total: 0 },
      direita: {
        P:    { transacoes: [], total: 0 },   // marcarP === true
        semP: { transacoes: [], total: 0 },   // marcarP === false
      },
      esquerda: {
        P:    { transacoes: [], total: 0 },
        semP: { transacoes: [], total: 0 },
      }
    };

    qs.forEach(docSnap => {
      const d = docSnap.data();
      const caixa = d.caixa || 'banco';               // antigos vão para banco
      const v = Number(d.valor) || 0;
      const ts = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
      const row = { ...d, id: docSnap.id, _date: ts, _valor: v };

      if (caixa === 'banco') {
        caixas.banco.transacoes.push(row);
        caixas.banco.total += v;
      } else if (caixa === 'direita' || caixa === 'esquerda') {
        const bucket = d.marcarP ? 'P' : 'semP';
        caixas[caixa][bucket].transacoes.push(row);
        caixas[caixa][bucket].total += v;
      }
    });

    // Helpers
    const trRow = (t, showPcol = false) => {
      const date = t._date.toLocaleDateString('pt-PT');
      const valorClass = t._valor >= 0 ? 'valor-positivo' : 'valor-negativo';
      const formattedValor = formatNumber(Math.abs(t._valor));
      return `
        <tr>
          <td>${date}</td>
          <td>${t.tipo}</td>
          <td class="${valorClass} formatted-number">${t._valor >= 0 ? '+' : '-'}€${formattedValor}</td>
          ${showPcol ? `<td>${t.marcarP ? 'P' : ''}</td>` : ''}
        </tr>
      `;
    };

    const tableWrap = (rowsHtml, showPcol = false) =>
      `<table>
         <tr>
           <th>Data</th><th>Tipo</th><th>Valor (€)</th>
           ${showPcol ? '<th>P</th>' : ''}
         </tr>
         ${rowsHtml || '<tr><td colspan="'+(showPcol?4:3)+'">Sem registos</td></tr>'}
       </table>`;

    const totalDiv = (label, total) => {
      const totalClass = total >= 0 ? 'valor-positivo' : 'valor-negativo';
      const formatted = formatNumber(Math.abs(total));
      return `<div class="total-caixa centered">${label}: <span class="${totalClass} formatted-number">${total >= 0 ? '+' : '-'}€${formatted}</span></div>`;
    };

    // Render Banco (simples)
    if (elBanco) {
      const rows = caixas.banco.transacoes.map(t => trRow(t, false)).join('');
      elBanco.innerHTML =
        `<h3>Transações</h3>
         ${tableWrap(rows, false)}
         ${totalDiv('Total', caixas.banco.total)}`;
    }

    // Render Direita/Esquerda (Sem P e P)
    const renderCaixaComP = (cont, dados) => {
      const totalGeral = dados.P.total + dados.semP.total;

      const rowsSemP = dados.semP.transacoes.map(t => trRow(t, true)).join('');
      const rowsP    = dados.P.transacoes.map(t => trRow(t, true)).join('');

      cont.innerHTML =
        `<h3>Sem P</h3>
         ${tableWrap(rowsSemP, true)}
         ${totalDiv('Total Sem P', dados.semP.total)}

         <h3 style="margin-top:1.25rem;">P</h3>
         ${tableWrap(rowsP, true)}
         ${totalDiv('Total P', dados.P.total)}

         <div style="margin-top:1.25rem;"></div>
         ${totalDiv('Total Geral', totalGeral)}`;
    };

    if (elDireita)  renderCaixaComP(elDireita,  caixas.direita);
    if (elEsquerda) renderCaixaComP(elEsquerda, caixas.esquerda);

  } catch (e) {
    console.error('Erro ao carregar relatório: ', e);
    [elBanco, elDireita, elEsquerda].forEach(el => { if (el) el.innerHTML = '<p>Ocorreu um erro ao carregar.</p>'; });
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  togglePVisibility();
  carregarRelatorio();
});
