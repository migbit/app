// taxa-municipal.js

// Função para obter o trimestre com base no mês
function getTrimestre(mes) {
    return Math.ceil(mes / 3);
}

// Função para carregar dados do LocalStorage
function carregarDados() {
    const dados = localStorage.getItem('taxa_municipal');
    return dados ? JSON.parse(dados) : [];
}

// Função para salvar dados no LocalStorage
function salvarDados(dados) {
    localStorage.setItem('taxa_municipal', JSON.stringify(dados));
}

// Event Listener para o formulário
document.getElementById('taxa-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Obter valores do formulário
    const valorTotal = parseFloat(document.getElementById('valor-total').value);
    const mes = parseInt(document.getElementById('mes').value);
    const ano = parseInt(document.getElementById('ano').value);
    const noitesExcedidas = parseInt(document.getElementById('noites-excedidas').value);
    const noitesCriancas = parseInt(document.getElementById('noites-criancas').value);

    // Cálculos
    const noitesPagas = valorTotal / 2;
    const trimestre = getTrimestre(mes);

    // Criar objeto de dados
    const novaEntrada = {
        valor_total: valorTotal,
        mes: mes,
        ano: ano,
        noites_pagadas: noitesPagas,
        noites_excedidas: noitesExcedidas,
        noites_criancas: noitesCriancas,
        trimestre: trimestre
    };

    // Carregar dados existentes e adicionar a nova entrada
    const dados = carregarDados();
    dados.push(novaEntrada);
    salvarDados(dados);

    // Resetar o formulário
    document.getElementById('taxa-form').reset();

    alert('Dados adicionados com sucesso!');
});

// Função para gerar relatório trimestral
function gerarRelatorio() {
    const dados = carregarDados();
    if (dados.length === 0) {
        alert('Nenhum dado disponível para gerar o relatório.');
        return;
    }

    // Agregar dados por trimestre
    const relatorio = {};

    dados.forEach(entry => {
        const key = `Trimestre ${entry.trimestre} - ${entry.ano}`;
        if (!relatorio[key]) {
            relatorio[key] = {
                total_noites_pagadas: 0,
                total_noites_excedidas: 0,
                total_noites_criancas: 0
            };
        }
        relatorio[key].total_noites_pagadas += entry.noites_pagadas;
        relatorio[key].total_noites_excedidas += entry.noites_excedidas;
        relatorio[key].total_noites_criancas += entry.noites_criancas;
    });

    // Construir o HTML do relatório
    let relatorioHTML = '<table border="1" cellpadding="10">';
    relatorioHTML += `
        <tr>
            <th>Trimestre</th>
            <th>Total Noites Pagas</th>
            <th>Total Noites Excedidas</th>
            <th>Total Noites Crianças</th>
        </tr>
    `;

    for (const trimestre in relatorio) {
        relatorioHTML += `
            <tr>
                <td>${trimestre}</td>
                <td>${relatorio[trimestre].total_noites_pagadas}</td>
                <td>${relatorio[trimestre].total_noites_excedidas}</td>
                <td>${relatorio[trimestre].total_noites_criancas}</td>
            </tr>
        `;
    }

    relatorioHTML += '</table>';

    // Exibir o relatório
    document.getElementById('relatorio-container').innerHTML = relatorioHTML;
}
