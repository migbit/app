// js/iva.js

// Selecionar elementos do DOM
const ivaForm = document.getElementById('iva-form');
const relatorioIvaDiv = document.getElementById('relatorio-iva');

// URL do seu Google Apps Script Web App
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUxwAM0O-ED9JJ7ueM5wNU5_im9VwVbrnhQ0T3E8WJnrE5bEbQri-kmHpFDH5jJIlU/exec'; // Substitua pelo URL real

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
            method: 'GET'
        });
        const result = await response.json();
        console.log('Resposta do servidor:', result);
        if (result.success) {
            alert('IVA registrado com sucesso!');
            ivaForm.reset();
            carregarRelatorio();
        } else {
            alert(`Erro: ${result.error || 'Ocorreu um erro desconhecido'}`);
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
        console.log('Dados recebidos:', data);

        if (data.error) {
            relatorioIvaDiv.innerHTML = `<p>Erro: ${data.error}</p>`;
            return;
        }

        if (!Array.isArray(data)) {
            relatorioIvaDiv.innerHTML = '<p>Dados recebidos em formato inesperado.</p>';
            console.error('Dados recebidos:', data);
            return;
        }

        if (data.length === 0) {
            relatorioIvaDiv.innerHTML = '<p>Nenhum dado de IVA registrado.</p>';
            return;
        }

        // Agregar dados por trimestre
        const dados = {};
        data.forEach(entry => {
            if (!entry['Data da Compra'] || !entry['Valor do IVA']) {
                console.warn('Entrada inválida:', entry);
                return;
            }

            const date = new Date(entry['Data da Compra']);
            const trimestre = Math.ceil((date.getMonth() + 1) / 3);
            const ano = date.getFullYear();
            const chave = `${ano} T${trimestre}`;

            if (!dados[chave]) {
                dados[chave] = 0;
            }
            dados[chave] += parseFloat(entry['Valor do IVA']);
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