// app/js/tmt.js
import { db } from './script.js';
import {
  collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// ---- DOM
const relatorioTmtDiv = document.getElementById('relatorio-tmt');

// ---- Init
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const faturas = await carregarFaturas();
    gerarRelatorioTMT(faturas);
  } catch (e) {
    console.error('Erro a carregar TMT:', e);
    relatorioTmtDiv.innerHTML = `<p style="color:#c00">Erro a carregar relatório TMT.</p>`;
  }
});

// ---- Data
async function carregarFaturas() {
  const q = query(collection(db, "faturas"), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Mesma agregação por ano/trimestre/apartamento da tua página anterior
function agruparPorAnoTrimestreApartamento(faturas) {
  return faturas.reduce((grupos, f) => {
    const tri = Math.ceil((+f.mes) / 3);
    const key = `${f.ano}-${tri}`;
    const apt = String(f.apartamento);

    if (!grupos[apt]) grupos[apt] = {};
    if (!grupos[apt][key]) {
      grupos[apt][key] = {
        valorOperador: 0,
        valorDireto: 0,
        noitesExtra: 0,
        noitesCriancas: 0,
        valorTmt: f.valorTmt,
        detalhes: []
      };
    }
    grupos[apt][key].valorOperador += Number(f.valorOperador || 0);
    grupos[apt][key].valorDireto  += Number(f.valorDireto  || 0);
    grupos[apt][key].noitesExtra  += Number(f.noitesExtra  || 0);
    grupos[apt][key].noitesCriancas += Number(f.noitesCriancas || 0);

    grupos[apt][key].detalhes.push(f);
    return grupos;
  }, {});
}

function obterNomeMes(n) {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return meses[(n|0)-1] || '';
}

// ---- UI
function gerarRelatorioTMT(faturas) {
  // (Opcional) filtrar para ano corrente; se preferires, remove este filtro
  // const anoAtual = new Date().getFullYear();
  // faturas = faturas.filter(f => f.ano === anoAtual);

  const byAptTri = agruparPorAnoTrimestreApartamento(faturas);

  let html = '';
  Object.entries(byAptTri).forEach(([apt, trimestres]) => {
    html += `<h3 style="margin-top:1rem;">Apartamento ${apt}</h3>`;
    html += `
      <table>
        <thead>
          <tr>
            <th>Ano</th>
            <th>Trimestre</th>
            <th>Estadias</th>
            <th>Extra 7 Noites</th>
            <th>Crianças</th>
            <th>Total</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.entries(trimestres).forEach(([triKey, dados]) => {
      const [ano, tri] = triKey.split('-').map(x => +x);
      const valorNoitesBase = Number(dados.valorOperador || 0) + Number(dados.valorDireto || 0);
      const valorTmt = Number(dados.valorTmt || 0);
      const estadias = valorTmt > 0 ? Math.round(valorNoitesBase / valorTmt) : 0;
      const totalEst = estadias + Number(dados.noitesExtra||0) + Number(dados.noitesCriancas||0);

      const detalhesJSON = encodeURIComponent(JSON.stringify(dados.detalhes));

      html += `
        <tr>
          <td>${ano}</td>
          <td>${tri}º</td>
          <td>${estadias}</td>
          <td>${dados.noitesExtra}</td>
          <td>${dados.noitesCriancas}</td>
          <td>${totalEst}</td>
          <td><button type="button" data-det="${detalhesJSON}" class="btn-detalhes">Ver Detalhes</button></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
  });

  relatorioTmtDiv.innerHTML = html;

  // listeners para abrir detalhes
  relatorioTmtDiv.querySelectorAll('.btn-detalhes').forEach(btn => {
    btn.addEventListener('click', () => {
      const detalhes = JSON.parse(decodeURIComponent(btn.dataset.det || '[]'));
      toggleDetalhes(btn, gerarHTMLDetalhesTMT(detalhes));
    });
  });
}

function toggleDetalhes(anchorBtn, contentHTML) {
  // cria/alternar um bloco de detalhes abaixo da célula do botão
  const td = anchorBtn.closest('td');
  let box = td.querySelector('.detalhes');
  if (box) {
    const visible = box.style.display !== 'none';
    box.style.display = visible ? 'none' : 'block';
    anchorBtn.textContent = visible ? 'Ver Detalhes' : 'Ocultar Detalhes';
    return;
  }
  box = document.createElement('div');
  box.className = 'detalhes';
  box.style.marginTop = '.5rem';
  box.innerHTML = contentHTML;
  td.appendChild(box);
  anchorBtn.textContent = 'Ocultar Detalhes';
}

function gerarHTMLDetalhesTMT(items) {
  if (!items || !items.length) return '<p>Sem registos neste trimestre.</p>';

  const rows = items
    .sort((a,b) => (a.ano - b.ano) || (a.mes - b.mes))
    .map(d => {
      const valOp = Number(d.valorOperador || 0);
      const valDir = Number(d.valorDireto  || 0);
      const valTmt = Number(d.valorTmt || 0);
      const base = valOp + valDir;
      const est  = valTmt > 0 ? Math.round(base / valTmt) : 0;

      return `
        <tr>
          <td>${d.ano}</td>
          <td>${obterNomeMes(d.mes)}</td>
          <td>${est}</td>
          <td>${Number(d.noitesExtra||0)}</td>
          <td>${Number(d.noitesCriancas||0)}</td>
          <td>€${base.toFixed(2)}</td>
          <td>€${valTmt.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

  return `
    <table class="detalhes-table">
      <thead>
        <tr>
          <th>Ano</th>
          <th>Mês</th>
          <th>Estadias</th>
          <th>Extra 7 Noites</th>
          <th>Crianças</th>
          <th>Base (€)</th>
          <th>TMT/noite (€)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
