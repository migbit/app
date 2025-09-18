// js/caixa.js (reworked)

import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM
const form = document.getElementById('caixa-form');
const tipoInput = document.getElementById('tipo');
const btnEntrada = document.getElementById('btn-entrada');
const btnSaida = document.getElementById('btn-saida');
const valorInput = document.getElementById('valor');
const descricaoInput = document.getElementById('descricao');
const dataInput = document.getElementById('data');
const caixaSelect = document.getElementById('caixa-select');
const flagP = document.getElementById('flag-p');

// Tabelas
const tblBanco = document.querySelector('#table-banco tbody');
const tblDireita = document.querySelector('#table-direita tbody');
const tblEsquerda = document.querySelector('#table-esquerda tbody');

// Subtotais
const subBanco = document.getElementById('subtotal-banco');
const subDirNP = document.getElementById('subtotal-direita-np');
const subDirP = document.getElementById('subtotal-direita-p');
const subEsqNP = document.getElementById('subtotal-esquerda-np');
const subEsqP = document.getElementById('subtotal-esquerda-p');

// Totais finais
const totalSemP = document.getElementById('total-sem-p');
const totalP = document.getElementById('total-p');

// Export
const btnExport = document.getElementById('btn-export');

// Estado
let transacoes = [];

// Utils
function parseValor(str){
  if (typeof str === 'number') return +(str.toFixed(2));
  if (!str) return 0;
  // Normaliza vírgula para ponto e remove separadores de milhar
  let s = String(str).trim().replace(/[\s\.]/g,'').replace(',', '.');
  // Agora s deve ser tipo 1234.56
  let v = parseFloat(s);
  if (isNaN(v)) return 0;
  // Limite €999.999,00
  if (v > 999999) v = 999999;
  return Math.round(v * 100) / 100;
}

function formatEUR(v){
  const sinal = v < 0 ? '-' : '+';
  const abs = Math.abs(v);
  return `${sinal}€${abs.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function setTipo(t){
  tipoInput.value = t;
  btnEntrada.classList.toggle('active', t === 'Entrada');
  btnSaida.classList.toggle('active', t === 'Saída');
}

btnEntrada.addEventListener('click', ()=> setTipo('Entrada'));
btnSaida.addEventListener('click', ()=> setTipo('Saída'));

caixaSelect.addEventListener('change', ()=>{
  const v = caixaSelect.value;
  const enableP = (v === 'Caixa Direita' || v === 'Caixa Esquerda');
  flagP.disabled = !enableP;
  if (!enableP) flagP.checked = false;
});

// Impor máscara/validação leve
valorInput.addEventListener('input', ()=>{
  // Permite dígitos, vírgula, ponto
  let v = valorInput.value.replace(/[^0-9,\.\s]/g,'');
  // evita mais do que uma vírgula/ponto decimal
  const parts = v.split(/[\.,]/);
  if (parts.length > 2){
    v = parts[0] + ',' + parts.slice(1).join('').replace(/[\.,]/g,'');
  }
  // Limite de dígitos antes da vírgula: 6
  const segs = v.split(/[,\.]/);
  segs[0] = segs[0].replace(/\s/g,'');
  if (segs[0].length > 6){
    segs[0] = segs[0].slice(0,6);
  }
  valorInput.value = segs.join(',');
});

// Submit
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const valor = parseValor(valorInput.value);
  if (valor <= 0){ alert('Introduza um valor válido.'); return; }
  const tipo = tipoInput.value; // Entrada | Saída
  const descricao = descricaoInput.value?.trim() || '';
  const caixa = caixaSelect.value;
  const isP = !!flagP.checked;

  // Data
  let data;
  if (dataInput.value){
    data = new Date(dataInput.value + 'T00:00:00');
  } else {
    data = new Date();
  }

  const payload = {
    data: Timestamp.fromDate(data),
    tipo,
    descricao,
    valor,        // número em euros com 2 casas
    caixa,        // 'Caixa Banco' | 'Caixa Direita' | 'Caixa Esquerda'
    isP           // true/false
  };

  try{
    await addDoc(collection(db, 'caixa'), payload);
    form.reset();
    setTipo('Entrada');
    caixaSelect.value = 'Caixa Banco';
    flagP.disabled = true;
    await carregar();
  }catch(err){
    console.error('Erro ao guardar:', err);
    alert('Erro ao guardar a transação.');
  }
});

function linhaHTML(tx){
  // Data
  let d = '';
  if (tx.data && tx.data.toDate){
    const dt = tx.data.toDate();
    d = dt.toLocaleDateString('pt-PT');
  } else if (tx.data instanceof Date){
    d = tx.data.toLocaleDateString('pt-PT');
  } else {
    d = '';
  }
  const valorSigned = (tx.tipo === 'Entrada' ? +tx.valor : -tx.valor);
  return `<tr>
    <td>${d}</td>
    <td>${tx.tipo}</td>
    <td>${tx.descricao ?? ''}</td>
    <td class="${valorSigned>=0?'value-pos':'value-neg'}">${formatEUR(valorSigned)}</td>
  </tr>`;
}

function soma(trans){
  return Math.round(trans.reduce((acc, t)=>{
    const s = (t.tipo === 'Entrada' ? +t.valor : -t.valor);
    return acc + s;
  }, 0) * 100) / 100;
}

async function carregar(){
  // Ler todas as transações, ordenar por data crescente por defeito
  const q = query(collection(db, 'caixa'), orderBy('data','asc'));
  const snap = await getDocs(q);
  transacoes = [];
  snap.forEach(doc=>{
    const d = doc.data();
    // Compatibilidade com dados antigos
    if (typeof d.isP !== 'boolean') d.isP = false;
    if (!d.caixa) d.caixa = 'Caixa Banco';
    // valor pode vir como string — normalizar
    d.valor = parseValor(d.valor);
    transacoes.push(d);
  });

  // Separar por caixa
  const arrBanco = transacoes.filter(t=> t.caixa === 'Caixa Banco');
  const arrDir = transacoes.filter(t=> t.caixa === 'Caixa Direita');
  const arrEsq = transacoes.filter(t=> t.caixa === 'Caixa Esquerda');

  // Render tabelas
  tblBanco.innerHTML = arrBanco.map(linhaHTML).join('') || '<tr><td colspan="4" class="muted">Sem movimentos.</td></tr>';
  tblDireita.innerHTML = arrDir.map(linhaHTML).join('') || '<tr><td colspan="4" class="muted">Sem movimentos.</td></tr>';
  tblEsquerda.innerHTML = arrEsq.map(linhaHTML).join('') || '<tr><td colspan="4" class="muted">Sem movimentos.</td></tr>';

  // Subtotais
  const bancoNP = soma(arrBanco); // Banco nunca tem P
  const dirNP = soma(arrDir.filter(t=> !t.isP));
  const dirP = soma(arrDir.filter(t=> t.isP));
  const esqNP = soma(arrEsq.filter(t=> !t.isP));
  const esqP = soma(arrEsq.filter(t=> t.isP));

  subBanco.textContent = formatEUR(bancoNP);
  subDirNP.textContent = formatEUR(dirNP);
  subDirP.textContent = formatEUR(dirP);
  subEsqNP.textContent = formatEUR(esqNP);
  subEsqP.textContent = formatEUR(esqP);

  // Totais finais
  const totalNP = bancoNP + dirNP + esqNP;
  const totalPonly = dirP + esqP;

  totalSemP.textContent = formatEUR(totalNP);
  totalP.textContent = formatEUR(totalPonly);
}

btnExport.addEventListener('click', ()=>{
  const rows = [
    ['Secção','Tipo','Valor'],
    ['Caixa Banco','Subtotal (sem P)', subBanco.textContent],
    ['Caixa Direita','Subtotal (sem P)', subDirNP.textContent],
    ['Caixa Direita','Subtotal (P)', subDirP.textContent],
    ['Caixa Esquerda','Subtotal (sem P)', subEsqNP.textContent],
    ['Caixa Esquerda','Subtotal (P)', subEsqP.textContent],
    ['Totais Finais','Total (sem P)', totalSemP.textContent],
    ['Totais Finais','Total (P)', totalP.textContent],
  ];
  const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'caixa_totais.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
    URL.revokeObjectURL(url);
    a.remove();
  }, 200);
});

document.addEventListener('DOMContentLoaded', ()=>{
  // defaults
  setTipo('Entrada');
  carregar();
});
