// js/iva.js

// Função para copiar texto (importada de script.js, se necessário)
import { copiarMensagem } from './script.js';

// Selecionar elementos do DOM
const ivaForm = document.getElementById('iva-form');
const relatorioIvaDiv = document.getElementById('relatorio-iva');

// URL do seu Google Apps Script Web App
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwd8HQ0EPfKfhxp2bFieQS74lhN3wDvbNyUBMQM1HeTtF_fQt29HEYuezZCCnztJl4W/exec'; // Substitua pelo URL real

// Função para adicionar um registro de IVA
ivaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataCompra = document.getElementById('data-compra').value;
    const valorIva = parseFloat(document.getElementById('valor-iva').value);

    if (!dataCompra || isNaN(valorIva) || valorIva <= 0) {
        alert('Por favor, insira dados válidos.');
        return;
    }

    const params = new URLSearchParams({
        action: 'add',
        data_compra: dataCompra,
        valor_iva: valorIva
    });

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
            method: 'GET' // Utilize 'POST' se o seu script está configurado para lidar com POST
        });
        const result = await response.json();
        if (result.success) {
            alert('IVA registrado com sucesso!');
            ivaForm.reset();
            carregarRelatorio();
        } else {
            alert(`Erro: ${result.error}`);
        }
    } catch (error) {
        console.error("Erro ao registrar IVA: ", error);
        alert('Ocorreu um erro ao registrar o IVA.');
    }
});

// Função para carregar e exibir o relatório trimestral
async function carregarRelatorio() {
    relatorioIvaDiv.innerHTML = '<p>Carregando relatórios...</p>';
    const params = new URLSearchParams({
        action: 'get'
    });

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
            method: 'GET'
        });
        const data = await response.json();

        if (data.error) {
            relatorioIvaDiv.innerHTML = `<p>Erro: ${data.error}</p>`;
            return;
        }

        // Agregar dados por trimestre
        const dados = {};
        data.forEach(entry => {
            const date = new Date(entry.Data_da_Compra);
            const trimestre = Math.ceil((date.getMonth() + 1) / 3);
            const ano = date.getFullYear();
            const chave = `${ano} T${trimestre}`;

            if (!dados[chave]) {
                dados[chave] = 0;
            }
            dados[chave] += parseFloat(entry.Valor_do_IVA);
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
