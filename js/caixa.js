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
  const containers = {
    banco:   document.getElementById('caixa-banco'),
    direita: document.getElementById('caixa-direita'),
    esquerda:document.getElementById('caixa-esquerda')
  };

  // placeholders
  Object.values(containers).forEach(el => { if (el) el.innerHTML = '<p>A carregar…</p>'; });

  try {
    const q  = query(collection(db, 'caixa'), orderBy('timestamp', 'desc'));
    const qs = await getDocs(q);

    const caixas = {
      banco:   { transacoes: [], total: 0 },
      direita: { transacoes: [], total: 0 },
      esquerda:{ transacoes: [], total: 0 }
    };

    qs.forEach(docSnap => {
      const data = docSnap.data();
      const key  = data.caixa || 'banco';           // dados antigos sem "caixa" vão para Banco
      if (!caixas[key]) return;

      const v = Number(data.valor) || 0;
      caixas[key].total += v;
      caixas[key].transacoes.push({ ...data, id: docSnap.id });
    });

    const renderCaixa = (key, dados) => {
      const target = containers[key];
      if (!target) return;

      let html = '<h3>Transações</h3><table>';
      if (key === 'banco') {
        html += '<tr><th>Data</th><th>Tipo</th><th>Valor (€)</th></tr>';
      } else {
        html += '<tr><th>Data</th><th>Tipo</th><th>Valor (€)</th><th>P</th></tr>';
      }

      dados.transacoes.forEach(t => {
        const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
        const date = ts.toLocaleDateString('pt-PT');
        const v = Number(t.valor) || 0;
        const valorClass = v >= 0 ? 'valor-positivo' : 'valor-negativo';
        const formattedValor = formatNumber(Math.abs(v));

        html += '<tr>';
        html += `<td>${date}</td>`;
        html += `<td>${t.tipo}</td>`;
        html += `<td class="${valorClass} formatted-number">${v >= 0 ? '+' : '-'}€${formattedValor}</td>`;
        if (key !== 'banco') {
          html += `<td>${t.marcarP ? 'P' : ''}</td>`;
        }
        html += '</tr>';
      });

      html += '</table>';

      const total = dados.total;
      const totalClass = total >= 0 ? 'valor-positivo' : 'valor-negativo';
      const formattedTotal = formatNumber(Math.abs(total));
      html += `<div class="total-caixa centered">Total: <span class="${totalClass} formatted-number">${total >= 0 ? '+' : '-'}€${formattedTotal}</span></div>`;

      target.innerHTML = html;
    };

    Object.entries(caixas).forEach(([key, dados]) => renderCaixa(key, dados));
  } catch (e) {
    console.error('Erro ao carregar relatório: ', e);
    Object.values(containers).forEach(el => { if (el) el.innerHTML = '<p>Ocorreu um erro ao carregar.</p>'; });
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  togglePVisibility();
  carregarRelatorio();
});
