// js/iva.js

import { copiarMensagem } from './script.js';

document.getElementById('iva-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataCompra = document.getElementById('data-compra').value;
    const valorIva = parseFloat(document.getElementById('valor-iva').value);

    if (!dataCompra || isNaN(valorIva) || valorIva <= 0) {
        alert('Por favor, insira dados válidos.');
        return;
    }

    const url = 'URL_DO_SEU_APPS_SCRIPT'; // Substitua pelo URL do seu Apps Script
    const params = new URLSearchParams({
        action: 'add',
        data_compra: dataCompra,
        valor_iva: valorIva
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
            alert('IVA registrado com sucesso!');
            document.getElementById('iva-form').reset();
            carregarRelatorio();
        } else {
            alert(`Erro: ${result.error}`);
        }
    } catch (error) {
        console.error("Erro ao registrar IVA: ", error);
        alert('Ocorreu um erro ao registrar o IVA.');
    }
});

async function carregarRelatorio() {
    const url = 'URL_DO_SEU_APPS_SCRIPT'; // Substitua pelo URL do seu Apps Script
    const params = new URLSearchParams({
        action: 'get'
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();

        // Agregar dados por trimestre
        const dados = {};
        data.forEach(entry => {
            const date = new Date(entry.data_compra);
            const trimestre = Math.ceil((date.getMonth() + 1) / 3);
            const ano = date.getFullYear();
            const chave = `${ano} T${trimestre}`;

            if (!dados[chave]) {
                dados[chave] = 0;
            }
            dados[chave] += parseFloat(entry.valor_iva);
        });

        // Criar HTML para exibir os relatórios
        let html = '<table>';
        html += '<tr><th>Trimestre</th><th>Total IVA Pago (€)</th></tr>';
        for (const chave in dados) {
            html += `<tr><td>${chave}</td><td>€ ${dados[chave].toFixed(2)}</td></tr>`;
        }
        html += '</table>';

        document.getElementById('relatorio-iva').innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar relatórios de IVA: ", error);
        document.getElementById('relatorio-iva').innerHTML = '<p>Ocorreu um erro ao carregar os relatórios.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();
