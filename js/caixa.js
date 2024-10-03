// js/caixa.js

import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Selecionar elementos do DOM
const caixaForm = document.getElementById('caixa-form');
const relatorioCaixaDiv = document.getElementById('relatorio-caixa');

// Função para adicionar uma transação
caixaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const descricao = document.getElementById('descricao').value.trim();
    const tipo = document.getElementById('tipo').value;
    const valor = parseFloat(document.getElementById('valor').value);

    if (!descricao || !tipo || isNaN(valor) || valor <= 0) {
        alert('Por favor, insira dados válidos.');
        return;
    }

    try {
        await addDoc(collection(db, "caixa"), {
            descricao: descricao,
            tipo: tipo,
            valor: valor,
            timestamp: new Date()
        });
        alert('Transação registrada com sucesso!');
        caixaForm.reset();
        carregarRelatorio();
    } catch (e) {
        console.error("Erro ao registrar transação: ", e);
        alert('Ocorreu um erro ao registrar a transação.');
    }
});

// Função para carregar e exibir o relatório de caixa
async function carregarRelatorio() {
    relatorioCaixaDiv.innerHTML = '<p>Carregando relatório...</p>';
    try {
        const q = query(collection(db, "caixa"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        let entradas = 0;
        let saidas = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.tipo === "Entrada") {
                entradas += data.valor;
            } else if (data.tipo === "Saída") {
                saidas += data.valor;
            }
        });

        const saldo = entradas - saidas;

        // Criar HTML para exibir os relatórios
        let html = '<table>';
        html += '<tr><th>Tipo</th><th>Total (€)</th></tr>';
        html += `<tr><td>Entradas</td><td>€ ${entradas.toFixed(2)}</td></tr>`;
        html += `<tr><td>Saídas</td><td>€ ${saidas.toFixed(2)}</td></tr>`;
        html += `<tr><td>Saldo</td><td>€ ${saldo.toFixed(2)}</td></tr>`;
        html += '</table>';

        relatorioCaixaDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatório de caixa: ", e);
        relatorioCaixaDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();
