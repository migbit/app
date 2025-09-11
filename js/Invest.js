// js/invest.js – Página exclusiva do DCA por ano

import { db } from '../js/script.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/* ========= Config ========= */
const DCA_CFG = {
  startYear: 2025,
  endYear: 2050,
  startMonth: 9,               // começa em Setembro/2025
  monthlyDefault: 100,         // DCA mensal
  rates: { pessimistic: 0.0384, realistic: 0.0464, optimistic: 0.0700 } // anuais
};

// Ano selecionado (por defeito, ano corrente dentro dos limites)
let dcaYearSelected = new Date().getFullYear();
if (dcaYearSelected < DCA_CFG.startYear) dcaYearSelected = DCA_CFG.startYear;
if (dcaYearSelected > DCA_CFG.endYear)   dcaYearSelected = DCA_CFG.endYear;

/* ========= Selectors ========= */
// Navegação
const dcaPrevYearBtn   = document.getElementById('dca-prev-year');
const dcaNextYearBtn   = document.getElementById('dca-next-year');
const dcaYearPrevEl    = document.getElementById('dca-year-prev');
const dcaYearCurEl     = document.getElementById('dca-year-current');
const dcaYearNextEl    = document.getElementById('dca-year-next');

// Tabelas
const dcaProjRows      = document.getElementById('dca-proj-rows');
const dcaRealRows      = document.getElementById('dca-real-rows');
const dcaTitleProj     = document.getElementById('dca-title-proj');
const dcaTitleReal     = document.getElementById('dca-title-real');

// Form de topo
const dcaForm      = document.getElementById('dca-form');
const dcaYear      = document.getElementById('dca-year');
const dcaMonthSel  = document.getElementById('dca-month-sel');
const dcaPortfolio = document.getElementById('dca-portfolio');

// Form inline
const dcaInlineForm   = document.getElementById('dca-inline-form');
const dcaInlineYM     = document.getElementById('dca-inline-ym');
const dcaInlineLabel  = document.getElementById('dca-inline-label');
const dcaInlineValue  = document.getElementById('dca-inline-portfolio');
const dcaInlineCancel = document.getElementById('dca-inline-cancel');

/* ========= Helpers ========= */
function toYYYYdashMM(y, mm){ return `${y}-${mm}`; }

function monthsBetweenInclusive(startY, startM, y, m){
  return (y - startY)*12 + (m - startM) + 1; // inclui mês final
}

function monthsOfYear(year){
  const startM = (year === DCA_CFG.startYear) ? DCA_CFG.startMonth : 1;
  const arr = [];
  for (let m = startM; m <= 12; m++){
    arr.push(toYYYYdashMM(year, String(m).padStart(2,'0')));
  }
  return arr;
}

// range total deste plano (2025-09..2050-12)
function mmRange(startYYYY, endYYYY, startMonth = 1){
  const out = [];
  for (let y = startYYYY; y <= endYYYY; y++){
    const mStart = (y === startYYYY) ? startMonth : 1;
    for (let m = mStart; m <= 12; m++){
      out.push(`${y}-${String(m).padStart(2,'0')}`);
    }
  }
  return out;
}

// Projeção acumulada com DCA + capitalização mensal
function projectSeries(rateAnnual, monthly, startYYYY, endYYYY, startMonth){
  const months = mmRange(startYYYY, endYYYY, startMonth);
  let bal = 0;
  const r = rateAnnual/12;
  return months.map(mm=>{
    bal += monthly;
    bal *= (1 + r);
    return { month:mm, value: bal };
  });
}

function investidoAte(ym){
  const y = parseInt(ym.slice(0,4),10);
  const m = parseInt(ym.slice(5,7),10);
  const n = monthsBetweenInclusive(DCA_CFG.startYear, DCA_CFG.startMonth, y, m);
  return DCA_CFG.monthlyDefault * n;
}

/* ========= Firestore ========= */
async function saveDcaEntry(yyyyMM, portfolio){
  const colRef = collection(db,'dca_entries');
  const qy = query(colRef, where('month','==',yyyyMM));
  const snap = await getDocs(qy);
  const payload = { month: yyyyMM, portfolio: Number(portfolio) };
  if (snap.empty) await addDoc(colRef, payload);
  else await updateDoc(doc(db,'dca_entries', snap.docs[0].id), payload);
}

async function loadDcaEntries(){
  const qs = await getDocs(collection(db,'dca_entries'));
  const rows = [];
  qs.forEach(d => rows.push({ id:d.id, ...d.data() }));
  rows.sort((a,b)=> a.month.localeCompare(b.month));
  return rows;
}

async function deleteDcaEntry(docId){
  await deleteDoc(doc(db,'dca_entries', docId));
}

/* ========= Render ========= */
function renderYearTables(rows, year){
  // cabeçalhos
  dcaYearPrevEl.textContent = year-1;
  dcaYearCurEl.textContent  = year;
  dcaYearNextEl.textContent = year+1;

  const months = monthsOfYear(year);
  dcaTitleProj.textContent = `Projeções para ${year}`;
  dcaTitleReal.textContent = `Registos reais de ${year}`;

  // Índice de registos por mês
  const byMonth = new Map(rows.map(r => [r.month, r]));

  // Projeções para lookup:
  const mapP = window.__DCA_PROJ__.mapP;
  const mapR = window.__DCA_PROJ__.mapR;
  const mapO = window.__DCA_PROJ__.mapO;

  /* Tabela A — Projeções */
  dcaProjRows.innerHTML = '';
  months.forEach(ym=>{
    const inv = investidoAte(ym);
    const vP  = mapP.get(ym);
    const vR  = mapR.get(ym);
    const vO  = mapO.get(ym);
    const has = byMonth.has(ym);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ym}</td>
      <td>$${inv.toFixed(2)}</td>
      <td>${vP ? '$'+vP.toFixed(2) : '—'}</td>
      <td>${vR ? '$'+vR.toFixed(2) : '—'}</td>
      <td>${vO ? '$'+vO.toFixed(2) : '—'}</td>
      <td>
        ${has
          ? '<span class="badge badge-success">Registado</span>'
          : `<button class="btn btn-sm btn-primary" data-reg="${ym}">Registar</button>`
        }
      </td>
    `;
    dcaProjRows.appendChild(tr);
  });

  // Abrir form inline ao clicar "Registar"
  dcaProjRows.querySelectorAll('[data-reg]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const ym = btn.dataset.reg;
      dcaInlineYM.value = ym;
      dcaInlineLabel.textContent = ym;
      dcaInlineValue.value = '';
      dcaInlineForm.style.display = 'flex';
      window.scrollTo({ top: dcaInlineForm.offsetTop - 80, behavior: 'smooth' });
    });
  });

  /* Tabela B — Reais */
  dcaRealRows.innerHTML = '';
  months.forEach(ym=>{
    const row = byMonth.get(ym);
    if (!row) return;

    const inv  = investidoAte(ym);
    const port = Number(row.portfolio);
    const realized = port - inv;
    const eff = inv > 0 ? (port/inv - 1) : 0;

    const vP  = mapP.get(ym);
    const vR  = mapR.get(ym);
    const vO  = mapO.get(ym);
    const dP = vP!=null ? port - vP : null;
    const dR = vR!=null ? port - vR : null;
    const dO = vO!=null ? port - vO : null;
    const fmtDelta = (x) => x==null ? '—' : `${x>=0?'+$':'-$'}${Math.abs(x).toFixed(2)}`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ym}</td>
      <td>$${inv.toFixed(2)}</td>
      <td>$${port.toFixed(2)}</td>
      <td>${realized>=0?'+$':'-$'}${Math.abs(realized).toFixed(2)}</td>
      <td>${(eff>=0?'+':'') + (eff*100).toFixed(2)}%</td>
      <td>${fmtDelta(dP)}</td>
      <td>${fmtDelta(dR)}</td>
      <td>${fmtDelta(dO)}</td>
      <td>
        <button class="btn btn-sm btn-primary" data-edit="${row.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-del="${row.id}">Apagar</button>
      </td>
    `;
    dcaRealRows.appendChild(tr);
  });

  // Editar
  dcaRealRows.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const tr = btn.closest('tr');
      const ym = tr.children[0].innerText;
      const currentVal = tr.children[2].innerText.replace('$','');
      dcaInlineYM.value = ym;
      dcaInlineLabel.textContent = ym;
      dcaInlineValue.value = currentVal;
      dcaInlineForm.style.display = 'flex';
      window.scrollTo({ top: dcaInlineForm.offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Apagar
  dcaRealRows.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      await deleteDoc(doc(db,'dca_entries', btn.dataset.del));
      await refreshDca();
    });
  });
}

/* ========= Refresh ========= */
async function refreshDca(){
  const rows = await loadDcaEntries();

  // construir projeções para lookup
  const start = DCA_CFG.startYear, end = DCA_CFG.endYear, m0 = DCA_CFG.startMonth;
  const projP = projectSeries(DCA_CFG.rates.pessimistic, DCA_CFG.monthlyDefault, start, end, m0);
  const projR = projectSeries(DCA_CFG.rates.realistic,  DCA_CFG.monthlyDefault, start, end, m0);
  const projO = projectSeries(DCA_CFG.rates.optimistic, DCA_CFG.monthlyDefault, start, end, m0);

  window.__DCA_PROJ__ = {
    mapP: new Map(projP.map(p => [p.month, p.value])),
    mapR: new Map(projR.map(p => [p.month, p.value])),
    mapO: new Map(projO.map(p => [p.month, p.value]))
  };

  renderYearTables(rows, dcaYearSelected);
}

/* ========= Listeners ========= */
// Form topo: guardar mês
dcaForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const y  = Number(dcaYear.value);
  const mm = dcaMonthSel.value;
  if (!y || !mm){ alert('Seleciona ano e mês.'); return; }
  const key = toYYYYdashMM(y, mm);
  await saveDcaEntry(key, dcaPortfolio.value);
  dcaForm.reset();
  presetYearMonth();
  await refreshDca();
});

// Form inline
dcaInlineForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const ym = dcaInlineYM.value;
  const val = dcaInlineValue.value;
  if (!ym || !val){ alert('Falta o valor.'); return; }
  await saveDcaEntry(ym, val);
  dcaInlineForm.style.display = 'none';
  await refreshDca();
});
dcaInlineCancel?.addEventListener('click', ()=>{
  dcaInlineForm.style.display = 'none';
});

// Navegação anos
dcaPrevYearBtn?.addEventListener('click', async ()=>{
  if (dcaYearSelected > DCA_CFG.startYear) {
    dcaYearSelected--;
    await refreshDca();
  }
});
dcaNextYearBtn?.addEventListener('click', async ()=>{
  if (dcaYearSelected < DCA_CFG.endYear) {
    dcaYearSelected++;
    await refreshDca();
  }
});

/* ========= Util ========= */
function presetYearMonth(){
  const now = new Date();
  if (dcaYear)     dcaYear.value = now.getFullYear();
  if (dcaMonthSel) dcaMonthSel.value = String(now.getMonth()+1).padStart(2,'0');
}

/* ========= Init ========= */
async function init(){
  try {
    presetYearMonth();
    await refreshDca();
  } catch (err){
    console.error('Invest init error:', err);
    alert('Erro a carregar Investimentos');
  }
}

document.addEventListener('DOMContentLoaded', init);
