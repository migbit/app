// js/cenas.js

import { db } from '../js/script.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    updateDoc, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Configuration
const CONFIG = {
    workerUrl: 'https://noisy-butterfly-af58.migbit84.workers.dev/',
    icalUrls: {
        '123': 'https://www.airbnb.pt/calendar/ical/1192674.ics?s=713a99e9483f6ed204d12be2acc1f940',
        '1248': 'https://www.airbnb.pt/calendar/ical/9776121.ics?s=20937949370c92092084c8f0e5a50bbb'
    },
    months: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
};

// DOM
const invoiceForm   = document.getElementById('carlos-invoice-form');
const invoicesBody  = document.getElementById('carlos-invoices-body');

// State
const state = {
    reservedDates: new Set(),
    selectedDates: new Set(), // Track selected dates
    today: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Calendar Functions
async function fetchIcalData(icalUrl) {
    try {
        const response = await fetch(`${CONFIG.workerUrl}?url=${encodeURIComponent(icalUrl)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of iCal data');
        }
        return text;
    } catch (error) {
        console.error('Error fetching iCal data:', error);
        throw error;
    }
}

function parseIcalData(icalData) {
    try {
        const jcalData = ICAL.parse(icalData);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents('vevent');

        return events.map(event => ({
            summary: event.getFirstPropertyValue('summary'),
            startDate: event.getFirstPropertyValue('dtstart').toJSDate(),
            endDate: event.getFirstPropertyValue('dtend').toJSDate()
        }));
    } catch (error) {
        console.error('Error parsing iCal data:', error);
        throw error;
    }
}

async function loadIcalData(apartmentId) {
    try {
        const icalData = await fetchIcalData(CONFIG.icalUrls[apartmentId]);
        const reservations = parseIcalData(icalData);
        
        reservations.forEach(reservation => {
            const dateStr = reservation.startDate.toISOString().split('T')[0];
            state.reservedDates.add(dateStr);
        });
    } catch (error) {
        console.error(`Error loading iCal for Apartment ${apartmentId}:`, error);
    }
}

function renderCalendar(month, year) {
    const monthYear = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    
    if (!monthYear || !calendarBody) {
        console.error('Required calendar elements not found');
        return;
    }

    // Clear previous content
    calendarBody.innerHTML = '';
    monthYear.textContent = `${CONFIG.months[month]} ${year}`;

    // Calculate calendar data
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let date = 1;

    // Create calendar grid
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');

        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');

            if (i === 0 && j < firstDay || date > daysInMonth) {
                cell.innerHTML = '';
            } else {
                const span = document.createElement('span');
                span.textContent = date;

                const dateObj = new Date(year, month, date);
                const dateStr = dateObj.toISOString().split('T')[0];

                // Check if the day is today
                if (date === state.today.getDate() && 
                    month === state.today.getMonth() && 
                    year === state.today.getFullYear()) {
                    span.classList.add('today');
                }

                // Apply reserved style if date is reserved
                if (state.reservedDates.has(dateStr)) {
                    span.classList.add('reserved');
                }

                // Apply selected style if date is selected
                if (state.selectedDates.has(dateStr)) {
                    span.classList.add('selected');
                }

                // Event listener for selecting/unselecting a date
                span.addEventListener('click', async () => {
                    if (span.classList.contains('selected')) {
                        // Unselect the date
                        span.classList.remove('selected');
                        state.selectedDates.delete(dateStr);
                        await removeSelectedDateFromFirebase(dateStr);
                    } else {
                        // Select the date
                        span.classList.add('selected');
                        state.selectedDates.add(dateStr);
                        await saveSelectedDateToFirebase(dateStr);
                    }
                });

                cell.appendChild(span);
                date++;
            }

            row.appendChild(cell);
        }

        calendarBody.appendChild(row);
        if (date > daysInMonth) break;
    }
}

// Firebase functions for saving and removing selected dates
async function saveSelectedDateToFirebase(dateStr) {
    try {
        await addDoc(collection(db, "selectedDates"), { date: dateStr });
        console.log(`Selected date ${dateStr} saved to Firebase`);
    } catch (error) {
        console.error("Error saving selected date:", error);
    }
}

async function removeSelectedDateFromFirebase(dateStr) {
    try {
        const q = query(collection(db, "selectedDates"), where("date", "==", dateStr));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
            console.log(`Unselected date ${dateStr} removed from Firebase`);
        });
    } catch (error) {
        console.error("Error removing selected date:", error);
    }
}

// Load selected dates from Firebase on page load
async function loadSelectedDates() {
    try {
        const querySnapshot = await getDocs(collection(db, "selectedDates"));
        querySnapshot.forEach((doc) => {
            const dateStr = doc.data().date;
            state.selectedDates.add(dateStr);
        });
        console.log("Selected dates loaded from Firebase");
    } catch (error) {
        console.error("Error loading selected dates:", error);
    }
}

// Todo List Functions
async function addTask(taskText) {
    try {
        const docRef = await addDoc(collection(db, "todos"), {
            text: taskText,
            timestamp: new Date()
        });
        console.log("Task added with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding task:", error);
        throw error;
    }
}

async function loadTasks() {
    const todoList = document.getElementById('todo-list');
    if (!todoList) return;

    todoList.innerHTML = '<li>Carregando tarefas...</li>';
    
    try {
        const q = query(collection(db, "todos"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        
        todoList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const task = doc.data();
            const li = document.createElement('li');
            
            const taskText = document.createElement('span');
            taskText.textContent = task.text;
            li.appendChild(taskText);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Apagar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteTask(doc.id);
            li.appendChild(deleteBtn);
            
            todoList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading tasks:", error);
        todoList.innerHTML = '<li>Erro ao carregar tarefas</li>';
    }
}

async function deleteTask(taskId) {
    try {
        await deleteDoc(doc(db, "todos", taskId));
        await loadTasks();
    } catch (error) {
        console.error("Error deleting task:", error);
        alert('Erro ao apagar tarefa');
    }
}

const dcaForm     = document.getElementById('dca-form');
const dcaRows     = document.getElementById('dca-rows');
const dcaYear     = document.getElementById('dca-year');
const dcaMonthSel = document.getElementById('dca-month-sel');
const dcaPortfolio= document.getElementById('dca-portfolio');

const chartIds = ['dca-chart-1','dca-chart-2','dca-chart-3','dca-chart-4','dca-chart-5'];
let dcaCharts = [];

// Parâmetros da estratégia Anti-crise
const DCA_CFG = {
  startYear: 2025,
  endYear: 2050,
  startMonth: 9,               // começa em setembro
  monthlyDefault: 100,         // usado nas projeções
  rates: { pessimistic: 0.0384, realistic: 0.0464, optimistic: 0.0700 }
};


// Pré-preencher com ano/mês atuais
function presetYearMonth(){
  const now = new Date();
  dcaYear.value = now.getFullYear();
  dcaMonthSel.value = String(now.getMonth()+1).padStart(2,'0');
}
presetYearMonth();


// Helpers
function ymKey(yyyyMM){ return yyyyMM; } // chave "YYYY-MM"
function toYYYYMM(date){
  const y = date.getFullYear();
  const m = (date.getMonth()+1).toString().padStart(2,'0');
  return `${y}-${m}`;
}
function mmRange(startYYYY, endYYYY, startMonth = 1) {
  const out = [];
  for (let y = startYYYY; y <= endYYYY; y++) {
    const mStart = (y === startYYYY) ? startMonth : 1;
    for (let m = mStart; m <= 12; m++) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }
  return out;
}

function toYYYYdashMM(y, mm){ return `${y}-${mm}`; }

function monthsBetweenInclusive(startY, startM, y, m){
  return (y - startY)*12 + (m - startM) + 1; // +1 inclui o mês final
}

function buildFiveYearSegments(startYYYY, startMonth, endYYYY){
  // Segmentos: [2025-09..2030-08], [2030-09..2035-08], ... até 2050-08
  const segments = [];
  let sy = startYYYY, sm = startMonth;
  while (sy < endYYYY) {
    let ey = sy + 5;       // +5 anos
    let em = sm - 1;       // termina no mês anterior (ex.: 9→8)
    if (em === 0) { em = 12; ey -= 1; }
    // não passar do endYYYY
    if (ey > endYYYY) { ey = endYYYY; em = 8; } // 2050-08 para fechar 25 anos desde 2025-09
    segments.push({
      label: `${sy}–${ey + (em === 12 ? 1 : 0) || ey}`, // label amigável; mas abaixo usamos títulos fixos
      startY: sy, startM: sm,
      endY: ey, endM: em
    });
    // próximo segmento começa no mês seguinte
    let nsm = sm + 1;
    let nsy = sy + 5;
    if (nsm === 13) { nsm = 1; nsy += 1; }
    sy = nsy; sm = nsm;
    if (sy >= endYYYY) break;
  }
  // Vamos forçar os títulos como pediste:
  const forcedTitles = [
    '2025–2030', '2030–2035', '2035–2040', '2040–2045', '2045–2050'
  ];
  return segments.slice(0,5).map((s,i)=>({ ...s, title: forcedTitles[i] || s.label }));
}

function withinRange(ym, sy, sm, ey, em){
  // ym = "YYYY-MM"
  const y = parseInt(ym.slice(0,4),10);
  const m = parseInt(ym.slice(5,7),10);
  if (y < sy || y > ey) return false;
  if (y === sy && m < sm) return false;
  if (y === ey && m > em) return false;
  return true;
}

function sliceSeries(seriesArr, seg){
  return seriesArr.filter(p => withinRange(p.month, seg.startY, seg.startM, seg.endY, seg.endM));
}

function renderDcaChartsSegmented(seriesAll){
  // destruir charts antigos
  dcaCharts.forEach(ch => ch && ch.destroy());
  dcaCharts = [];

  const segments = buildFiveYearSegments(DCA_CFG.startYear, DCA_CFG.startMonth, DCA_CFG.endYear);

  const makeDs = (label, data, dashed=false) => ({
    label,
    data: data.map(p => Number(p.value.toFixed(2))),
    borderWidth: 2,
    tension: 0.12,
    borderDash: dashed ? [6,6] : undefined,
    pointRadius: 0,
    fill: false
  });

  segments.forEach((seg, i) => {
    const ctx = document.getElementById(chartIds[i]).getContext('2d');

    const serP = sliceSeries(seriesAll.pessimistic, seg);
    const serR = sliceSeries(seriesAll.realistic,  seg);
    const serO = sliceSeries(seriesAll.optimistic, seg);
    const serA = sliceSeries(seriesAll.actual,     seg);

    const labels = serR.map(p => p.month); // eixo X

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          makeDs('Pessimista', serP),
          makeDs('Realista',   serR),
          makeDs('Otimista',   serO),
          { ...makeDs('Real (inputs)', serA, true), stepped: true }
        ]
      },
      options: {
        maintainAspectRatio: false,
        layout: { padding: { left: 8, right: 12, top: 4, bottom: 4 } },
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 18 } },
          title: { display: true, text: seg.title, align: 'start', padding: { bottom: 6 } },
          tooltip: { callbacks: {
            label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
          }}
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              callback: (value, index) => {
                const lbl = labels[index] || '';
                // mostra ano no 1.º ponto do segmento e nos Janeiros
                if (index === 0) return lbl.slice(0,4);
                return lbl.endsWith('-01') ? lbl.slice(0,4) : '';
              }
            },
            grid: { drawOnChartArea: false }
          },
          y: {
            beginAtZero: true,
            ticks: { callback: v => '$' + v.toLocaleString() }
          }
        }
      }
    });

    dcaCharts.push(chart);
  });
}

// Firestore
async function saveDcaEntry(yyyyMM, portfolio){
  const colRef = collection(db,'dca_entries');
  const qy = query(colRef, where('month','==',yyyyMM));
  const snap = await getDocs(qy);
  const payload = { month: yyyyMM, portfolio: Number(portfolio) };
  if (snap.empty){
    await addDoc(colRef, payload);
  } else {
    await updateDoc(doc(db,'dca_entries', snap.docs[0].id), payload);
  }
}



async function loadDcaEntries(){
  const colRef = collection(db,'dca_entries');
  const qs = await getDocs(colRef);
  const rows = [];
  qs.forEach(d => rows.push({ id:d.id, ...d.data() }));
  rows.sort((a,b)=>a.month.localeCompare(b.month));
  return rows;
}


async function deleteDcaEntry(docId){
  await deleteDoc(doc(db,'dca_entries', docId));
}

// Projeções (compounding mensal)
function projectSeries(rateAnnual, monthly, startYYYY, endYYYY, startMonth){
  const months = mmRange(startYYYY, endYYYY, startMonth);
  let bal = 0;
  const r = rateAnnual/12;
  const out = [];
  months.forEach(mm=>{
    bal += monthly;
    bal *= 1 + r;
    out.push({ month:mm, value: bal });
  });
  return out;
}

function actualSeries(entries, startYYYY, endYYYY, startMonth){
  const months = mmRange(startYYYY, endYYYY, startMonth);
  const map = new Map(entries.map(e => [e.month, e]));
  let bal = 0;                  // total investido acumulado (sem render)
  const out = [];
  months.forEach(mm => {
    const row = map.get(mm);
    const contrib = row ? Number(row.total) : 0;
    bal += contrib;             // soma apenas o que investiste nesse mês
    out.push({ month: mm, value: bal });
  });
  return out;
}

function actualSeriesFromPortfolio(entries, startYYYY, endYYYY, startMonth){
  const months = mmRange(startYYYY, endYYYY, startMonth);
  const map = new Map(entries.map(e => [e.month, Number(e.portfolio)]));
  return months.map(mm => ({ month: mm, value: map.has(mm) ? map.get(mm) : null }));
}


// Render tabela
function renderDcaTable(rows){
  dcaRows.innerHTML = '';
  rows.forEach(r=>{
    // Investido acumulado até YYYY-MM
    const y = parseInt(r.month.slice(0,4), 10);
    const m = parseInt(r.month.slice(5,7), 10);
    const nMonths = monthsBetweenInclusive(DCA_CFG.startYear, DCA_CFG.startMonth, y, m);
    const invested = DCA_CFG.monthlyDefault * nMonths;

    const portfolio = Number(r.portfolio);
    const realized  = portfolio - invested;
    const effRate   = invested > 0 ? (portfolio/invested - 1) : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.month}</td>
      <td>$${invested.toFixed(2)}</td>
      <td>$${portfolio.toFixed(2)}</td>
      <td>${realized>=0?'+$':'-$'}${Math.abs(realized).toFixed(2)}</td>
      <td>${(effRate>=0?'+':'') + (effRate*100).toFixed(2)}%</td>
      <td>
        <button class="btn btn-sm btn-primary" data-edit="${r.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-del="${r.id}">Apagar</button>
      </td>
    `;
    dcaRows.appendChild(tr);
  });

  // Apagar
  dcaRows.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      await deleteDoc(doc(db,'dca_entries', btn.dataset.del));
      await refreshDca();
    });
  });

  // Editar (preenche ano/mês e carteira)
  dcaRows.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.edit;
      const row = Array.from(dcaRows.children).find(tr => tr.querySelector(`[data-edit="${id}"]`));
      const tds = row.querySelectorAll('td');
      const ym = tds[0].innerText;
      dcaYear.value = ym.slice(0,4);
      dcaMonthSel.value = ym.slice(5,7);
      dcaPortfolio.value = tds[2].innerText.replace('$','');
      window.scrollTo({ top: dcaForm.offsetTop - 20, behavior:'smooth' });
    });
  });
}


// Constrói linhas do resumo acumulado
function buildSummaryRows(rows){
  // rows já vem ordenado por mês
  let investedCum = 0;
  return rows.map(r=>{
    investedCum += Number(r.total);
    const havePortfolio = r.portfolio != null && !Number.isNaN(Number(r.portfolio));
    const valueReal = havePortfolio ? Number(r.portfolio) : null;
    const realized = havePortfolio ? (valueReal - investedCum) : null;
    const effRate = havePortfolio && investedCum > 0 ? (valueReal/investedCum - 1) : null;

    return {
      month: r.month,
      invested: investedCum,
      valueReal,
      realized,
      effRate
    };
  });
}

function renderSummaryTable(rows){
  dcaSummaryRows.innerHTML = '';
  const data = buildSummaryRows(rows);
  data.forEach(row=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>$${row.invested.toFixed(2)}</td>
      <td>${row.valueReal == null ? '—' : '$'+row.valueReal.toFixed(2)}</td>
      <td>${row.realized == null ? '—' : (row.realized>=0?'+$':'-$') + Math.abs(row.realized).toFixed(2)}</td>
      <td>${row.effRate == null ? '—' : (row.effRate>=0?'+':'') + (row.effRate*100).toFixed(2) + '%'}</td>
    `;
    dcaSummaryRows.appendChild(tr);
  });
}


// Render Chart
function renderDcaChart(series){
  const ctx = dcaChartEl.getContext('2d');
  const labels = series.realistic.map(p => p.month); // ex.: "2025-09", "2025-10", ...

  const ds = (label, data, dashed = false) => ({
    label,
    data: data.map(p => Number(p.value.toFixed(2))),
    borderWidth: 2,
    tension: 0.12,
    borderDash: dashed ? [6, 6] : undefined,
    pointRadius: 0,
    fill: false
  });

  if (dcaChart) dcaChart.destroy();

  dcaChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
        datasets: [
        ds('Pessimista', series.pessimistic),
        ds('Realista',  series.realistic),
        ds('Otimista',  series.optimistic),
            { ...ds('Real (inputs)', series.actual, true), stepped: true } // <= aqui
        ]
    },
    options: {
      maintainAspectRatio: false,
      layout: { padding: { left: 8, right: 16, top: 8, bottom: 8 } },
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 20 } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            // Mostrar o ano no 1.º ponto (mesmo sendo Setembro)
            // e depois só em Janeiro de cada ano.
            callback: (value, index) => {
              const lbl = (typeof value === 'string') ? value : (labels[index] || '');
              if (index === 0) return lbl.slice(0, 4);         // ex.: "2025" no 1.º ponto (2025-09)
              return lbl.endsWith('-01') ? lbl.slice(0, 4) : ''; // janeiro de cada ano
            }
          },
          grid: { drawOnChartArea: false }
        },
        y: {
          beginAtZero: true,
          ticks: { callback: v => '$' + v.toLocaleString() }
        }
      }
    }
  });
}

// Refresh total (carrega dados, redesenha tabela e gráfico)
async function refreshDca(){
  const rows = await loadDcaEntries();
  renderDcaTable(rows);
  renderSummaryTable(rows);

const start = DCA_CFG.startYear;
const end   = DCA_CFG.endYear;
const m0    = DCA_CFG.startMonth;

// Projeções (mantêm-se iguais)
const projP = projectSeries(DCA_CFG.rates.pessimistic, DCA_CFG.monthlyDefault, start, end, m0);
const projR = projectSeries(DCA_CFG.rates.realistic,  DCA_CFG.monthlyDefault, start, end, m0);
const projO = projectSeries(DCA_CFG.rates.optimistic, DCA_CFG.monthlyDefault, start, end, m0);

// Real = valores de carteira (sem qualquer juro simulado)
const realS = actualSeriesFromPortfolio(rows, start, end, m0);

renderDcaChartsSegmented({
  pessimistic: projP,
  realistic:   projR,
  optimistic:  projO,
  actual:      realS
});

renderDcaTable(rows);


}

// Handler do form
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


// —— Secção Carlos (Faturas Pendentes) ——
  
  // 1) Adicionar nova fatura
  async function addInvoice(e) {
    e.preventDefault();
    const numero = document.getElementById('invoice-number').value.trim();
    const data   = document.getElementById('invoice-date').value;
    const total  = parseFloat(document.getElementById('invoice-total').value);
    if (!numero || !data || isNaN(total)) {
      alert('Preencha todos os campos da fatura');
      return;
    }
  
    try {
      await addDoc(collection(db, 'carlosInvoices'), { numero, data, total });
      invoiceForm.reset();
      loadInvoices();
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar fatura');
    }
  }
  
  // 2) Carregar e renderizar todas faturas + pagamentos
  async function loadInvoices() {
    invoicesBody.innerHTML = '<tr><td colspan="6">Carregando…</td></tr>';
    try {
      const snapInv = await getDocs(collection(db, 'carlosInvoices'));
      const invoices = snapInv.docs.map(d => ({ id: d.id, ...d.data() }));
      invoicesBody.innerHTML = '';
      await Promise.all(invoices.map(inv => renderInvoiceRow(inv)));
      if (invoices.length === 0) {
        invoicesBody.innerHTML = '<tr><td colspan="6">Nenhuma fatura cadastrada</td></tr>';
      }
    } catch (err) {
      console.error(err);
      invoicesBody.innerHTML = '<tr><td colspan="6">Erro ao carregar faturas</td></tr>';
    }
  }
  
  // 3) Renderizar cada linha de fatura + sub-tabela de pagamentos
  async function renderInvoiceRow(inv) {
    // 1) Puxa todos os pagamentos desta fatura
    const snapPay  = await getDocs(collection(db, 'carlosInvoices', inv.id, 'payments'));
    const payments = snapPay.docs.map(p => p.data());
    const paidSum  = payments.reduce((s,p) => s + p.valorPago, 0);
    const balance  = inv.total - paidSum;
  
    // 2) Linha principal da fatura
    const trInv = document.createElement('tr');
    if (paidSum >= inv.total) trInv.classList.add('text-muted');
    trInv.innerHTML = `
      <td>${inv.numero}</td>
      <td>${inv.data}</td>
      <td>€${inv.total.toFixed(2)}</td>
      <td>€${paidSum.toFixed(2)}</td>
      <td>€${balance.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-primary btn-add-payment">Adicionar Pag.</button>
      </td>
    `;
    invoicesBody.appendChild(trInv);
  
    // 3) Linhas de cada pagamento efetuado
    payments.forEach(pay => {
      const trPay = document.createElement('tr');
      trPay.classList.add('text-secondary');
      trPay.innerHTML = `
        <td></td>
        <td>${pay.dataPagamento}</td>
        <td></td>
        <td>€${pay.valorPago.toFixed(2)}</td>
        <td></td>
        <td></td>
      `;
      invoicesBody.appendChild(trPay);
    });
  
    // 4) Linha contendo o formulário, inicialmente escondido
    const trForm = document.createElement('tr');
    trForm.innerHTML = `
      <td colspan="6" style="display:none;">
        <form class="form-inline" id="payment-form-${inv.id}">
          <input type="date"   name="dataPagamento" required>
          <input type="number" name="valorPago" placeholder="Valor (€)" step="0.01" max="${balance.toFixed(2)}" required>
          <button type="submit" class="btn btn-success btn-sm ml-2">Registar</button>
        </form>
      </td>
    `;
    invoicesBody.appendChild(trForm);
  
    // 5) Toggle do form
    trInv.querySelector('.btn-add-payment').addEventListener('click', () => {
      const cell = trForm.firstElementChild;
      cell.style.display = cell.style.display === 'none' ? 'block' : 'none';
    });
  
    // 6) Submissão do formulário
    trForm.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      const dataPagamento = f.dataPagamento.value;
      const valorPago     = parseFloat(f.valorPago.value);
      try {
        await addDoc(
          collection(db, 'carlosInvoices', inv.id, 'payments'),
          { dataPagamento, valorPago }
        );
        loadInvoices();
      } catch (err) {
        console.error(err);
        alert('Erro ao registar pagamento');
      }
    });
  }

// Event Listeners (extended to support comments)
function setupEventListeners() {
    document.getElementById('prev-month')?.addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar(state.currentMonth, state.currentYear);
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar(state.currentMonth, state.currentYear);
    });

    // Todo form
    document.getElementById('todo-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        if (!input) return;

        const taskText = input.value.trim();
        if (!taskText) {
            alert('Por favor, insira uma tarefa válida');
            return;
        }

        try {
            await addTask(taskText);
            input.value = '';
            await loadTasks();
        } catch (error) {
            alert('Erro ao adicionar tarefa');
        }
    });
}

// Initialization
async function init() {
    try {
        // Load reservations
        const loadPromises = Object.keys(CONFIG.icalUrls).map(loadIcalData);
        await Promise.allSettled(loadPromises);

        // Load selected dates
        await loadSelectedDates();

        // Initialize calendar
        renderCalendar(state.currentMonth, state.currentYear);
        
        // Load tasks
        await loadTasks();

        // DCA – carregar e desenhar
        await refreshDca();

        // Inicializar Carlos – Faturas Pendentes
invoiceForm.addEventListener('submit', addInvoice);
await loadInvoices();

        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Erro ao inicializar a aplicação');
    }
}

// Checklist Data
const checklists = {
    aulaRPM: [
        "Calções", "Camisola", "Meias Bike", "Fita Banda Cardíaca", "Banda Cardíaca", 
        "Sapatilhas Bike", "Chinelos", "Calções banho", "Toalha pequena", "Toalha grande", "Água", "Meias", "Boxers"
    ],
    bikeRide: [
        "Banda Cardíaca", "Óculos", "Luz", "Eletrólitos", "Dinheiro", "Capacete", "Energético", "H20", "GPS", "Luvas", "Saco tlmv", "Pressão 6 bar"
    ],
    Ginásio: [
        "Toalha Pequena", "Toalha Grande", "Calções", "T-Shirt", "Chinelos", "Sapatilhas"
    ]
};

// Function to load checklist items based on selection
function loadChecklist() {
    const checklistDropdown = document.getElementById("checklist-dropdown");
    const checklistItemsContainer = document.getElementById("checklist-items");

    // Clear previous checklist
    checklistItemsContainer.innerHTML = '';
    checklistItemsContainer.style.display = 'none';

    // Get selected checklist
    const selectedChecklist = checklistDropdown.value;
    if (selectedChecklist && checklists[selectedChecklist]) {
        checklists[selectedChecklist].forEach((item) => {
            // Create list item with color change on click
            const listItem = document.createElement("li");
            listItem.className = "list-group-item checklist-item";
            listItem.textContent = item;
            listItem.style.color = "red"; // Initial color

            // Event listener to toggle color on click
            listItem.addEventListener("click", () => {
                if (listItem.style.color === "red") {
                    listItem.style.color = "green";
                }
                
                // Check if all items are green
                const allGreen = [...checklistItemsContainer.querySelectorAll(".checklist-item")]
                    .every(item => item.style.color === "green");
                if (allGreen) {
                    checklistItemsContainer.style.display = 'none';
                }
            });

            checklistItemsContainer.appendChild(listItem);
        });

        // Show checklist
        checklistItemsContainer.style.display = 'block';
    }
}

// Event Listener for Dropdown Change
document.getElementById("checklist-dropdown").addEventListener("change", loadChecklist);



// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
