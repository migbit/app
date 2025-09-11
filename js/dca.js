// js/invest.js — INVEST 1 tabela/ano, inline edit, CSV, projeções

import { db } from '../js/script.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/* ===== Config ===== */
const CFG = {
  startYear: 2025,
  startMonth: 9,   // Setembro
  endYear: 2050,
  monthlyDca: 100,
  rates: { pess: 0.0384, real: 0.0464, otim: 0.0700 }, // anuais
};
const PT_M = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ===== Helpers ===== */
const ym = (y,m) => `${y}-${String(m).padStart(2,'0')}`;
const pretty = (y,m) => `${PT_M[m-1]} ${y}`;
function monthsFromStartTo(y,m){
  return (y - CFG.startYear)*12 + (m - CFG.startMonth) + 1;
}
function investidoAte(y,m){
  const n = monthsFromStartTo(y,m);
  return n>0 ? n * CFG.monthlyDca : 0;
}
function mmRange(){
  const arr = [];
  for(let y=CFG.startYear;y<=CFG.endYear;y++){
    const m0 = (y===CFG.startYear?CFG.startMonth:1);
    for(let m=m0;m<=12;m++) arr.push({y,m,ym:ym(y,m)});
  }
  return arr;
}
function groupByYear(list){
  const map = new Map();
  list.forEach(({y,m,ym})=>{
    if(!map.has(y)) map.set(y,[]);
    map.get(y).push({y,m,ym});
  });
  return map;
}

/* Projeções acumuladas DCA + compounding mensal */
function buildProjections(){
  const months = mmRange();
  const maps = { pess:new Map(), real:new Map(), otim:new Map() };
  let balP=0, balR=0, balO=0;
  const rP=CFG.rates.pess/12, rR=CFG.rates.real/12, rO=CFG.rates.otim/12;

  months.forEach(({ym})=>{
    balP += CFG.monthlyDca; balP *= (1+rP); maps.pess.set(ym, balP);
    balR += CFG.monthlyDca; balR *= (1+rR); maps.real.set(ym, balR);
    balO += CFG.monthlyDca; balO *= (1+rO); maps.otim.set(ym, balO);
  });
  return maps;
}

/* ===== Firestore ===== */
async function loadEntries(){
  const rows = [];
  const qs = await getDocs(collection(db,'dca_entries'));
  qs.forEach(d=> rows.push({ id:d.id, ...d.data() })); // {id, month:"YYYY-MM", portfolio:Number}
  const map = new Map(rows.map(r=>[r.month, r]));
  return { rows, map };
}
async function upsertPortfolio(monthStr, val){
  const colRef = collection(db,'dca_entries');
  const qy = query(colRef, where('month','==',monthStr));
  const snap = await getDocs(qy);
  const payload = { month: monthStr, portfolio: Number(val) };
  if (snap.empty) await addDoc(colRef, payload);
  else await updateDoc(doc(db,'dca_entries', snap.docs[0].id), payload);
}
async function removeEntry(docId){ await deleteDoc(doc(db,'dca_entries', docId)); }

/* ===== Render ===== */
const root = document.getElementById('invest-root');
let PROJ = null;
let CURRENT_YEAR = (new Date()).getFullYear();
if (CURRENT_YEAR<CFG.startYear) CURRENT_YEAR = CFG.startYear;
if (CURRENT_YEAR>CFG.endYear)   CURRENT_YEAR = CFG.endYear;

function renderYearBlock(year, monthsOfYear, entryMap){
  // Título + mostrar/ocultar + CSV
  const wrapper = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'year-header';
  const h2 = document.createElement('h2'); h2.textContent = year;
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary btn-sm year-toggle';
  btn.textContent = (year===CURRENT_YEAR) ? 'Ocultar' : 'Mostrar';
  const csvBtn = document.createElement('button');
  csvBtn.className = 'btn btn-primary btn-sm';
  csvBtn.textContent = 'Exportar CSV';

  header.appendChild(h2);
  header.appendChild(btn);
  header.appendChild(csvBtn);
  wrapper.appendChild(header);

  // Tabela
  const table = document.createElement('table');
  table.className = 'table table-striped table-narrow';
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="nowrap">Ano</th>
      <th class="nowrap">Mês</th>
      <th class="right nowrap">DCA</th>
      <th class="right nowrap">Rentabilidade</th>
      <th class="right nowrap">Carteira</th>
      <th class="right nowrap">Realizado</th>
      <th class="right nowrap">Pessimista</th>
      <th class="right nowrap">Realista</th>
      <th class="right nowrap">Otimista</th>
      <th class="nowrap">Ações</th>
    </tr>
  `;
  const tbody = document.createElement('tbody');

  let totalInvest=0, totalPort=0;

  monthsOfYear.forEach(({y,m,ym})=>{
    const inv = investidoAte(y,m);
    const vP  = PROJ.pess.get(ym);
    const vR  = PROJ.real.get(ym);
    const vO  = PROJ.otim.get(ym);

    const entry = entryMap.get(ym) || null;
    const port = entry ? Number(entry.portfolio) : null;
    const realized = (port!=null) ? port - inv : null;
    const eff = (port!=null && inv>0) ? (port/inv - 1) : null;

    if (port!=null){ totalInvest = inv; totalPort = port; }

    const tr = document.createElement('tr');

    // cells
    const cYear = `<td class="nowrap">${y}</td>`;
    const cMonth = `<td class="nowrap">${PT_M[m-1]}</td>`;
    const cDca = `<td class="right">$${CFG.monthlyDca.toFixed(2)}</td>`;
    const cRent = `<td class="right ${eff==null?'muted':(eff>=0?'rent-pos':'rent-neg')}">${eff==null?'—':((eff*100)>=0?'+':'') + (eff*100).toFixed(2)+'%'}</td>`;

    // Carteira: célula editável inline
    const carteiraCell = document.createElement('td');
    carteiraCell.className = 'right edit-cell';
    carteiraCell.dataset.ym = ym;
    carteiraCell.innerHTML = port==null ? '<span class="muted">—</span>' : `$${port.toFixed(2)}`;

    // Realizado
    const cReal = `<td class="right ${realized==null?'muted':(realized>=0?'rent-pos':'rent-neg')}">${realized==null?'—':(realized>=0?'+$':'-$')+Math.abs(realized).toFixed(2)}</td>`;

    const cP = `<td class="right">${vP?('$'+vP.toFixed(2)):'—'}</td>`;
    const cR = `<td class="right">${vR?('$'+vR.toFixed(2)):'—'}</td>`;
    const cO = `<td class="right">${vO?('$'+vO.toFixed(2)):'—'}</td>`;

    // Ações: Editar/Apagar
    const actions = document.createElement('td');
    actions.className = 'nowrap';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-link-sm';
    editBtn.textContent = 'Editar';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-link-sm';
    delBtn.textContent = 'Apagar';
    if (!entry) delBtn.disabled = true;

    actions.appendChild(editBtn);
    actions.appendChild(document.createTextNode(' | '));
    actions.appendChild(delBtn);

    tr.innerHTML = cYear + cMonth + cDca + cRent;
    tr.appendChild(carteiraCell);
    tr.insertAdjacentHTML('beforeend', cReal + cP + cR + cO);
    tr.appendChild(actions);
    tbody.appendChild(tr);

    // Inline edit handlers
    function openEditor(){
      const current = entryMap.get(ym)?.portfolio ?? '';
      carteiraCell.innerHTML = `<input type="number" step="0.01" min="0" value="${current}" />`;
      const input = carteiraCell.querySelector('input');
      input.focus();
      input.select();

      const save = async ()=>{
        const val = input.value;
        if (val === '') { carteiraCell.innerHTML = '<span class="muted">—</span>'; return; }
        await upsertPortfolio(ym, val);
        await refresh(); // re-render este ano
      };
      const cancel = ()=> {
        carteiraCell.innerHTML = current === '' ? '<span class="muted">—</span>' : `$${Number(current).toFixed(2)}`;
      };

      input.addEventListener('keydown', async (e)=>{
        if (e.key==='Enter'){ await save(); }
        if (e.key==='Escape'){ cancel(); }
      });
      input.addEventListener('blur', save);
    }

    carteiraCell.addEventListener('dblclick', openEditor);
    editBtn.addEventListener('click', openEditor);
    delBtn.addEventListener('click', async ()=>{
      const docId = entry?.id;
      if (!docId) return;
      if (!confirm(`Apagar registo de ${pretty(y,m)}?`)) return;
      await removeEntry(docId);
      await refresh();
    });
  });

  // Total do ano (soma acumulada até ao último mês com carteira)
  const tfoot = document.createElement('tfoot');
  const rentTot = (totalInvest>0) ? (totalPort/totalInvest - 1) : null;
  const trTot = document.createElement('tr');
  trTot.className = 'total-row';
  trTot.innerHTML = `
    <td colspan="2">Total ${year}</td>
    <td class="right">$${(CFG.monthlyDca).toFixed(2)}</td>
    <td class="right ${rentTot==null?'muted':(rentTot>=0?'rent-pos':'rent-neg')}">${rentTot==null?'—':((rentTot*100)>=0?'+':'')+(rentTot*100).toFixed(2)}%</td>
    <td class="right">${totalPort?('$'+totalPort.toFixed(2)):'—'}</td>
    <td class="right">${(totalPort&&totalInvest)?((totalPort-totalInvest>=0?'+$':'-$')+Math.abs(totalPort-totalInvest).toFixed(2)):'—'}</td>
    <td class="right muted">—</td>
    <td class="right muted">—</td>
    <td class="right muted">—</td>
    <td></td>
  `;
  tfoot.appendChild(trTot);

  table.appendChild(thead);
  table.appendChild(tbody);
  table.appendChild(tfoot);
  wrapper.appendChild(table);

  // Mostrar/ocultar meses do ano
  const collapsed = (year!==CURRENT_YEAR);
  table.style.display = collapsed ? 'none' : '';
  btn.textContent = collapsed ? 'Mostrar' : 'Ocultar';
  btn.addEventListener('click', ()=>{
    const isHidden = table.style.display==='none';
    table.style.display = isHidden ? '' : 'none';
    btn.textContent = isHidden ? 'Ocultar' : 'Mostrar';
  });

  // Export CSV do ano
  csvBtn.addEventListener('click', ()=>{
    const rows = [['Ano','Mês','DCA','Rentabilidade','Carteira','Realizado','Pessimista','Realista','Otimista']];
    table.querySelectorAll('tbody tr').forEach(tr=>{
      const tds = [...tr.children].map(td=>td.innerText.replace(/\u00A0/g,' ').trim());
      // Ano, Mês, DCA, Rentabilidade, Carteira, Realizado, Pess, Real, Otim
      rows.push([tds[0], tds[1], tds[2], tds[3], tds[4], tds[5], tds[6], tds[7], tds[8]]);
    });
    const csv = rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invest_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  return wrapper;
}

/* ===== Refresh ===== */
async function refresh(){
  // Projeções (uma vez por refresh)
  PROJ = buildProjections();

  // Dados reais
  const { rows, map } = await loadEntries();

  // Construir UI por ano
  root.innerHTML = '';
  const all = groupByYear(mmRange());
  [...all.keys()].sort((a,b)=>a-b).forEach(y=>{
    const block = renderYearBlock(y, all.get(y), map);
    root.appendChild(block);
  });

  // Scroll para o ano corrente (se expandido)
  const yearHeaders = [...root.querySelectorAll('.year-header h2')];
  const idx = yearHeaders.findIndex(h=>h.textContent==String(CURRENT_YEAR));
  if (idx>=0){
    yearHeaders[idx].scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', refresh);
