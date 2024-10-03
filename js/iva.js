// js/iva.js

import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Selecionar elementos do DOM
const ivaForm = document.getElementById('iva-form');
const relatorioIvaDiv = document.getElementById('relatorio-iva');

// Função para adicionar um registro de IVA
ivaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataCompra = document.getElementById('data-compra').value;
    const valorIva = parseFloat(document.getElementById('valor-iva').value);

    if (!dataCompra || isNaN(valorIva) || valorIva <= 0) {
        alert('Por favor, insira dados válidos.');
        return;
    }

    try {
        await addDoc(collection(db, "iva"), {
            data_compra: dataCompra,
            valor_iva: valorIva
        });
        alert('IVA registrado com sucesso!');
        ivaForm.reset();
        carregarRelatorio();
    } catch (e) {
        console.error("Erro ao registrar IVA: ", e);
        alert('Ocorreu um erro ao registrar o IVA.');
    }
});

// Função para carregar e exibir o relatório trimestral
async function carregarRelatorio() {
    relatorioIvaDiv.innerHTML = '<p>Carregando relatórios...</p>';
    try {
        const q = query(collection(db, "iva"), orderBy("data_compra", "asc"));
        const querySnapshot = await getDocs(q);
        const dados = {};

        querySnapshot.forEach((doc) => {
            const dataCompra = doc.data().data_compra;
            const valorIva = doc.data().valor_iva;

            const date = new Date(dataCompra);
            const trimestre = Math.ceil((date.getMonth() + 1) / 3);
            const ano = date.getFullYear();
            const chave = `${ano} T${trimestre}`;

            if (!dados[chave]) {
                dados[chave] = 0;
            }
            dados[chave] += valorIva;
        });

        // Criar HTML para exibir os relatórios
        let html = '<table>';
        html += '<tr><th>Trimestre</th><th>Total IVA Pago</th></tr>';
        for (const chave in dados) {
            html += `<tr><td>${chave}</td><td>€ ${dados[chave].toFixed(2)}</td></tr>`;
        }
        html += '</table>';

        relatorioIvaDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatórios de IVA: ", e);
        relatorioIvaDiv.innerHTML = '<p>Ocorreu um erro ao carregar os relatórios.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();
