// js/iva.js

// Inicializar Firestore
const db = firebase.firestore();

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
        await db.collection('iva').add({
            dataCompra: dataCompra,
            valorIva: valorIva,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('IVA registrado com sucesso!');
        ivaForm.reset();
        carregarRelatorio();
    } catch (error) {
        console.error("Erro ao registrar IVA: ", error);
        alert('Ocorreu um erro ao registrar o IVA.');
    }
});

// Função para carregar e exibir o relatório trimestral
async function carregarRelatorio() {
    try {
        const snapshot = await db.collection('iva').orderBy('dataCompra').get();
        const ivaData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (ivaData.length === 0) {
            relatorioIvaDiv.innerHTML = '<p>Nenhum dado de IVA registrado.</p>';
            return;
        }

        // Agregar dados por trimestre
        const dados = {};
        ivaData.forEach(entry => {
            const date = new Date(entry.dataCompra);
            const trimestre = Math.ceil((date.getMonth() + 1) / 3);
            const ano = date.getFullYear();
            const chave = `${ano} T${trimestre}`;

            if (!dados[chave]) {
                dados[chave] = 0;
            }
            dados[chave] += entry.valorIva;
        });

        // Criar HTML para exibir os relatórios
        let html = '<table>';
        html += '<tr><th>Trimestre</th><th>Total IVA Pago (€)</th></tr>';
        for (const chave in dados) {
            html += `<tr><td>${chave}</td><td>€ ${dados[chave].toFixed(2)}</td></tr>`;
        }
        html += '</table>';

        relatorioIvaDiv.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar relatórios de IVA: ", error);
        relatorioIvaDiv.innerHTML = '<p>Ocorreu um erro ao carregar os relatórios.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();