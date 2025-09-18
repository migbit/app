// js/caixa.js

// Importar Firestore
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, deleteField } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";


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

    // Agrupadores
    const caixas = {
      banco:   { transacoes: [], total: 0 },
      direita: { P: [], semP: [], totalP: 0, totalSemP: 0 },
      esquerda:{ P: [], semP: [], totalP: 0, totalSemP: 0 }
    };

    qs.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;
      const caixa = d.caixa || 'banco'; // docs antigos → banco (apenas em memória)
      const v = Number(d.valor) || 0;
      const ts = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
      const row = { ...d, id, _valor: v, _date: ts };

      if (caixa === 'banco') {
        caixas.banco.transacoes.push(row);
        caixas.banco.total += v;
      } else if (caixa === 'direita' || caixa === 'esquerda') {
        const isP = !!d.marcarP;
        if (caixa === 'direita') {
          (isP ? caixas.direita.P : caixas.direita.semP).push(row);
          isP ? (caixas.direita.totalP += v) : (caixas.direita.totalSemP += v);
        } else {
          (isP ? caixas.esquerda.P : caixas.esquerda.semP).push(row);
          isP ? (caixas.esquerda.totalP += v) : (caixas.esquerda.totalSemP += v);
        }
      }
    });

    // helpers
    const rowActions = (id) =>
      `<div class="row-actions" style="display:flex; gap:.4rem; justify-content:center;">
         <button type="button" class="btn-edit" data-action="edit" data-id="${id}">Editar</button>
         <button type="button" class="btn-remove" data-action="remove" data-id="${id}">Remover</button>
       </div>`;

    const trRow = (t, showPcol) => {
      const date = t._date.toLocaleDateString('pt-PT');
      const v = t._valor;
      const valorClass = v >= 0 ? 'valor-positivo' : 'valor-negativo';
      const formattedValor = formatNumber(Math.abs(v));
      return `
        <tr data-id="${t.id}">
          <td>${date}</td>
          <td>${t.tipo}</td>
          <td class="${valorClass} formatted-number">${v >= 0 ? '+' : '-'}€${formattedValor}</td>
          ${showPcol ? `<td>${t.marcarP ? 'P' : ''}</td>` : ''}
          <td>${rowActions(t.id)}</td>
        </tr>
      `;
    };

    const tableWrap = (rowsHtml, cols) =>
      `<table>
         <tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr>
         ${rowsHtml || `<tr><td colspan="${cols.length}" style="text-align:center;">Sem registos</td></tr>`}
       </table>`;

    const totalDiv = (label, total) => {
      const totalClass = total >= 0 ? 'valor-positivo' : 'valor-negativo';
      const formatted = formatNumber(Math.abs(total));
      return `<div class="total-caixa centered">${label}: <span class="${totalClass} formatted-number">${total >= 0 ? '+' : '-'}€${formatted}</span></div>`;
    };

    // Render Banco
    if (elBanco) {
      const rows = caixas.banco.transacoes.map(t => trRow(t, false)).join('');
      elBanco.innerHTML =
        tableWrap(rows, ['Data','Tipo','Valor (€)','Ações']) +
        totalDiv('Total', caixas.banco.total);
    }

    // Render Direita/Esquerda com Sem P e P (totais separados e total geral)
    const renderCaixaComP = (cont, dados) => {
      const rowsSemP = dados.semP.map(t => trRow(t, true)).join('');
      const rowsP    = dados.P.map(t => trRow(t, true)).join('');
      const totalGeral = dados.totalP + dados.totalSemP;

      cont.innerHTML =
        `<h3>Sem P</h3>` +
        tableWrap(rowsSemP, ['Data','Tipo','Valor (€)','P','Ações']) +
        totalDiv('Total Sem P', dados.totalSemP) +
        `<h3 style="margin-top:1.25rem;">P</h3>` +
        tableWrap(rowsP, ['Data','Tipo','Valor (€)','P','Ações']) +
        totalDiv('Total P', dados.totalP) +
        `<div style="margin-top:1.25rem;"></div>` +
        totalDiv('Total Geral', totalGeral);
    };

    if (elDireita)  renderCaixaComP(elDireita,  caixas.direita);
    if (elEsquerda) renderCaixaComP(elEsquerda, caixas.esquerda);

  } catch (e) {
    console.error('Erro ao carregar relatório: ', e);
    [elBanco, elDireita, elEsquerda].forEach(el => { if (el) el.innerHTML = '<p>Ocorreu um erro ao carregar.</p>'; });
  }
}

// Click handler para Editar / Remover / Guardar / Cancelar
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id');
  if (!id && (action === 'edit' || action === 'remove' || action === 'save')) return;

  if (action === 'remove') {
    if (!confirm('Remover esta transação?')) return;
    await deleteDoc(doc(db, 'caixa', id));
    await carregarRelatorio();
    return;
  }

  if (action === 'edit') {
    const tr = btn.closest('tr');
    if (!tr) return;

    // Ler dados atuais do row (a forma mais estável é refazer a partir da tabela)
    const tds = Array.from(tr.children);
    const currentDate = tds[0].textContent.trim(); // apenas informativo
    const currentTipo = tds[1].textContent.trim();
    const currentValorTxt = tds[2].textContent.trim().replace(/[+€.\s]/g,'').replace(',', '.');
    const negative = tds[2].textContent.includes('-');
    const currentValor = (negative ? -1 : 1) * parseFloat(currentValorTxt || '0');

    const hasPcol = tds.length === 5; // Banco: 4 cols; Direita/Esquerda: 5 cols (inclui P)
    const currentP = hasPcol ? (tds[3].textContent.trim() === 'P') : false;

    // Construir UI de edição inline
    const tipoSel = `
      <select class="edit-tipo">
        <option value="Entrada" ${currentTipo==='Entrada'?'selected':''}>Entrada</option>
        <option value="Saída"   ${currentTipo==='Saída'  ?'selected':''}>Saída</option>
      </select>`;

    const valorInput = `<input type="number" class="edit-valor" step="0.01" value="${Math.abs(currentValor)}" style="width:110px;">`;

    // Caixa select (permite mover a linha entre caixas)
    const caixaSel = `
      <select class="edit-caixa">
        <option value="banco">Caixa Banco</option>
        <option value="direita">Caixa Direita</option>
        <option value="esquerda">Caixa Esquerda</option>
      </select>`;

    const pCheck = `<label style="display:flex; align-items:center; gap:.4rem;">
                      <input type="checkbox" class="edit-p" ${currentP ? 'checked':''}> P
                    </label>`;

    // Guardar o antigo innerHTML para cancel
    tr.setAttribute('data-old-html', tr.innerHTML);

    // Montar as células em modo edição
    tr.innerHTML = `
      <td>${currentDate}</td>
      <td>${tipoSel}</td>
      <td>${valorInput}</td>
      ${hasPcol ? `<td>${pCheck}</td>` : ''}
      <td>
        <div style="display:flex; gap:.4rem; align-items:center; flex-wrap:wrap;">
          ${caixaSel}
          <button type="button" data-action="save" data-id="${id}">Guardar</button>
          <button type="button" data-action="cancel" data-id="${id}">Cancelar</button>
        </div>
      </td>
    `;

    // Pre-selecionar a caixa correta com base no container onde a linha está
    const container = tr.closest('#caixa-banco, #caixa-direita, #caixa-esquerda');
    const sel = tr.querySelector('.edit-caixa');
    if (container?.id === 'caixa-banco') sel.value = 'banco';
    if (container?.id === 'caixa-direita') sel.value = 'direita';
    if (container?.id === 'caixa-esquerda') sel.value = 'esquerda';

    // Mostrar/ocultar checkbox P conforme caixa escolhida
    const togglePEdit = () => {
      const pWrapper = tr.querySelector('.edit-p')?.closest('label');
      if (!pWrapper) return;
      pWrapper.style.display = (sel.value === 'banco') ? 'none' : 'flex';
    };
    togglePEdit();
    sel.addEventListener('change', togglePEdit);

    return;
  }

  if (action === 'cancel') {
    const tr = e.target.closest('tr');
    if (!tr) return;
    tr.innerHTML = tr.getAttribute('data-old-html') || tr.innerHTML;
    tr.removeAttribute('data-old-html');
    return;
  }

  if (action === 'save') {
    const tr = e.target.closest('tr');
    if (!tr) return;

    const id = e.target.getAttribute('data-id');
    const newTipo  = tr.querySelector('.edit-tipo').value;
    const newValor = parseFloat(tr.querySelector('.edit-valor').value || '0');
    const newCaixa = tr.querySelector('.edit-caixa').value;
    const newPbox  = tr.querySelector('.edit-p');
    const newP     = newCaixa === 'banco' ? false : !!(newPbox && newPbox.checked);

    if (!newValor || newValor <= 0) { alert('Valor inválido'); return; }

    const docRef = doc(db, 'caixa', id);
    const update = {
      tipo: newTipo,
      valor: newTipo === 'Entrada' ? Math.abs(newValor) : -Math.abs(newValor),
      caixa: newCaixa
    };
    if (newCaixa === 'banco') {
      update.marcarP = deleteField(); // limpar P se mover para Banco
    } else {
      update.marcarP = newP;
    }

    await updateDoc(docRef, update);
    await carregarRelatorio();
    return;
  }
});


// Init
document.addEventListener('DOMContentLoaded', () => {
  togglePVisibility();
  carregarRelatorio();
});
