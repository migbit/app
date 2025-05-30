// compras.js
// Stand‑alone JS for Lista de Compras page

// 1) Imports & Firestore reference (from script.js)
import { db } from './script.js';
import { doc, updateDoc, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 2) Predefined categories (reuse from HTML)
const listaCompras = {
  "Produtos Limpeza": ["Lixívia tradicional","Multiusos com Lixívia","Gel com Lixívia","CIF","Limpeza Chão (Lava Tudo)","Limpeza Chão (Madeira)","Limpa Vidros","Limpeza Potente","Limpeza Placas","Vinagre","Álcool"],
  "Roupa": ["Detergente Roupa","Amaciador","Lixívia Roupa Branca","Tira Nódoas","Tira Gorduras","Oxi Active","Branqueador","Perfumador"],
  "WC": ["Papel Higiénico","Gel WC Sanitas","Toalhitas","Toalhitas Desmaquilhantes","Blocos Sanitários","Anticalcário","Limpeza Chuveiro","Desentupidor de Canos","Manutenção Canos","Papel Higiénico Húmido","Sabonete Líquido"],
  "Cozinha": ["Água 1.5l","Água 5l","Café","Rolo de Cozinha","Guardanapos","Bolachas","Chá","Lava-Loiça","Esfregões Verdes","Esfregões Bravo","Película Transparente","Papel Alumínio","Sacos congelação"],
  "Diversos": ["Varetas Difusoras (Ambientador)","Limpa Óculos"]
};

// 3) UI construction functions
export function criarListaCompras() {
  const form = document.getElementById('compras-form');
  form.innerHTML = '';
  // Predefined
  Object.entries(listaCompras).forEach(([cat, itens]) => {
    const sec = document.createElement('div'); sec.className = 'categoria';
    sec.innerHTML = `<h3>${cat}</h3>`;
    itens.forEach(nome => {
      const div = criarItemCompra(nome);
      div.dataset.name = nome;
      sec.appendChild(div);
    });
    form.appendChild(sec);
  });
  // Custom
  const ad = document.createElement('div'); ad.className = 'categoria';
  ad.innerHTML = `<h3>Itens Adicionais</h3><div id="custom-items-container"></div><button type="button" id="btn-adicionar-custom-item">Adicionar Item</button>`;
  form.appendChild(ad);
}

export function criarItemCompra(nome) {
  const div = document.createElement('div'); div.className = 'item-compra';
  div.innerHTML = `
    <div class="item-info">
      <span class="item-nome">${nome}</span>
      <input type="number" class="item-quantidade" value="0" readonly min="0" max="99" />
    </div>
    <div class="item-controles">
      <button class="btn-aumentar">+</button>
      <button class="btn-diminuir">-</button>
      <button class="btn-zero">0</button>
      <button class="btn-local-c">C</button>
    </div>
  `;
  return div;
}

export function criarItemCompraEmBranco() {
  const div = document.createElement('div'); div.className = 'item-compra';
  div.innerHTML = `
    <div class="item-info">
      <input type="text" class="item-nome-custom" placeholder="Novo item" />
      <input type="number" class="item-quantidade" value="0" readonly min="0" max="99" />
    </div>
    <div class="item-controles">
      <button class="btn-aumentar">+</button>
      <button class="btn-diminuir">-</button>
      <button class="btn-zero">0</button>
      <button class="btn-local-c">C</button>
      <button class="btn-remover-custom-item">🗑️</button>
    </div>
  `;
  return div;
}

// 4) Firestore synchronization
export async function salvarItem(nome, quantidade, local) {
  const ref = doc(db, 'listas_compras', 'lista_atual');
  await updateDoc(ref, {
    [`itens.${nome}`]: { quantidade, local },
    ultimaAtualizacao: Timestamp.now()
  });
}

export function populateComprasUI(itens) {
  criarListaCompras();
  const pre = new Set(Object.values(listaCompras).flat());
  Object.entries(itens).forEach(([nome, {quantidade, local}]) => {
    const el = document.querySelector(`[data-name="${nome}"]`);
    if (el) {
      el.querySelector('.item-quantidade').value = quantidade;
      el.dataset.local = local;
      el.querySelector('.btn-local-c').classList.toggle('active', local === 'C');
    } else {
      const div = criarItemCompraEmBranco();
      div.dataset.name = nome;
      div.querySelector('.item-nome-custom').value = nome;
      div.querySelector('.item-quantidade').value = quantidade;
      div.dataset.local = local;
      div.querySelector('.btn-local-c').classList.toggle('active', local === 'C');
      document.getElementById('custom-items-container').appendChild(div);
    }
  });
}

export function monitorListaCompras() {
  const ref = doc(db, 'listas_compras', 'lista_atual');
  onSnapshot(ref, snap => snap.exists() && populateComprasUI(snap.data().itens));
}

// 5) Events & delegation
export function attachEventListeners() {
  document.getElementById('compras-form').addEventListener('click', async e => {
    if (e.target.id === 'btn-adicionar-custom-item') {
      document.getElementById('custom-items-container').appendChild(criarItemCompraEmBranco());
      return;
    }
    const div = e.target.closest('.item-compra'); if (!div) return;
    const inp = div.querySelector('.item-quantidade');
    const nomeEl = div.querySelector('.item-nome, .item-nome-custom');
    const nome = nomeEl.textContent?.trim() || nomeEl.value.trim();
    let local = div.dataset.local || 'Não definido';
    if (e.target.classList.contains('btn-aumentar')) inp.value = Math.min(+inp.value + 1,99);
    else if (e.target.classList.contains('btn-diminuir')) inp.value = Math.max(+inp.value - 1,0);
    else if (e.target.classList.contains('btn-zero')) inp.value = 0;
    else if (e.target.classList.contains('btn-local-c')) {
      local = local === 'C' ? 'Não definido' : 'C';
      div.dataset.local = local;
      e.target.classList.toggle('active');
    } else if (e.target.classList.contains('btn-remover-custom-item')) {
      div.remove();
      await salvarItem(nome,0,'Não definido');
      return;
    } else return;
    div.classList.toggle('item-comprado', +inp.value > 0);
    await salvarItem(nome, +inp.value, local);
  });

  // Requisitar
  document.getElementById('btn-requisitar').addEventListener('click', async () => {
    const resumo = gerarResumo();
    document.getElementById('resumo-conteudo').innerHTML = resumo.replace(/\n/g,'<br>');
    document.getElementById('resumo').style.display = 'block';
    document.querySelectorAll('.item-compra').forEach(async div => {
      const nomeEl = div.querySelector('.item-nome, .item-nome-custom');
      const nome = nomeEl.textContent?.trim()||nomeEl.value.trim();
      const qt = +div.querySelector('.item-quantidade').value;
      const local = div.dataset.local || 'Não definido';
      if (nome && qt) await salvarItem(nome, qt, local);
    });
  });

  // Enviar Email
  document.getElementById('btn-enviar-email').addEventListener('click', () => enviarEmailListaCompras(gerarResumo()));

  // Search
  document.getElementById('search-input').addEventListener('input', e => aplicarFiltro(e.target.value));
  document.getElementById('clear-search').addEventListener('click', () => { document.getElementById('search-input').value = ''; aplicarFiltro(''); });
}

// 6) Summary & helpers
export function gerarResumo() {
  let r = '';
  document.querySelectorAll('.item-compra').forEach(div => {
    const nomeEl = div.querySelector('.item-nome, .item-nome-custom');
    const nome = nomeEl.textContent?.trim() || nomeEl.value.trim();
    const qt = +div.querySelector('.item-quantidade').value;
    const local = div.dataset.local;
    if (nome && qt) r += `${nome}: ${qt}${local==='C'? ' (Casa)':''}\n`;
  });
  return r;
}

export function enviarEmailListaCompras(resumo) {
  emailjs.send('service_tuglp9h','template_4micnki',{
    to_name:'apartments.oporto@gmail.com', subject:'Lista de Compras', message:resumo
  });
}

// 7) Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  criarListaCompras();
  attachEventListeners();
  monitorListaCompras();
});
