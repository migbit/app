// js/iva.js

const API_URL = 'https://script.google.com/macros/s/AKfycbwd8HQ0EPfKfhxp2bFieQS74lhN3wDvbNyUBMQM1HeTtF_fQt29HEYuezZCCnztJl4W/exec'; // Substitua SEU_SCRIPT_ID pelo ID real

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
        const response = await fetch(`${API_URL}?sheet=IVA&action=create&data_compra=${dataCompra}&valor_iva=${valorIva}`, {
            method: 'GET'
        });
        const result = await response.json();
        if (result.status === 'success') {
            alert('IVA registrado com sucesso!');
            ivaForm.reset();
            carregarRelatorio();
        } else {
            alert('Erro ao registrar IVA: ' + result.message);
        }
    } catch (error) {
        console.error("Erro ao registrar IVA: ", error);
        alert('Ocorreu um erro ao registrar o IVA.');
    }
});

// Função para carregar e exibir o relatório trimestral
async function carregarRelatorio() {
    relatorioIvaDiv.innerHTML = '<p>Carregando relatórios...</p>';
    try {
        const response = await fetch(`${API_URL}?sheet=IVA&action=read`, {
            method: 'GET'
        });
        const result = await response.json();
        if (result.status === 'success') {
            const dados = result.data;
            const dadosTrimestrais = {};

            dados.forEach(entry => {
                const data = new Date(entry.data_compra);
                const trimestre = Math.ceil((data.getMonth() + 1) / 3);
                const ano = data.getFullYear();
                const chave = `${ano} T${trimestre}`;

                if (!dadosTrimestrais[chave]) {
                    dadosTrimestrais[chave] = 0;
                }
                dadosTrimestrais[chave] += parseFloat(entry.valor_iva);
            });

            // Criar HTML para exibir os relatórios
            let html = '<table>';
            html += '<tr><th>Trimestre</th><th>Total IVA Pago (€)</th></tr>';
            for (const chave in dadosTrimestrais) {
                html += `<tr><td>${chave}</td><td>€ ${dadosTrimestrais[chave].toFixed(2)}</td></tr>`;
            }
            html += '</table>';

            relatorioIvaDiv.innerHTML = html;
        } else {
            relatorioIvaDiv.innerHTML = `<p>Erro ao carregar relatórios: ${result.message}</p>`;
        }
    } catch (error) {
        console.error("Erro ao carregar relatórios de IVA: ", error);
        relatorioIvaDiv.innerHTML = '<p>Ocorreu um erro ao carregar os relatórios.</p>';
    }
}

// Carregar o relatório ao iniciar
carregarRelatorio();
