// js/taxa-municipal.js

// Importar a instância do Firestore do script.js e funções necessárias do Firestore
import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const tmtForm = document.getElementById('tmt-form');
const relatorioTmtDiv = document.getElementById('relatorio-tmt');
const anoInput = document.getElementById('ano');
const mesSelect = document.getElementById('mes');
const apartamentoSelect = document.getElementById('apartamento');
const valorTmtInput = document.getElementById('valor-tmt');
const valorPagoDiretamenteInput = document.getElementById('valor-pago-diretamente');
const noitesExtraInput = document.getElementById('noites-extra');
const noitesCriancasInput = document.getElementById('noites-criancas');

/**
 * Define o ano e mês atuais como padrão nos campos de entrada.
 */
function definirAnoMesAtual() {
    const hoje = new Date();
    anoInput.value = hoje.getFullYear();
    mesSelect.value = hoje.getMonth() + 1; // getMonth() retorna de 0 a 11
}

// Chamar a função ao carregar a página
document.addEventListener('DOMContentLoaded', definirAnoMesAtual);

/**
 * Função para adicionar um registro de T.M.T.
 */
tmtForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apartamento = apartamentoSelect.value;
    const valorTmtPorNoite = parseFloat(valorTmtInput.value);
    const ano = parseInt(anoInput.value);
    const mes = parseInt(mesSelect.value);
    const valorPagoOperador = parseFloat(document.getElementById('valor-pago-operador').value);
    // Se os campos opcionais estiverem vazios, definir como 0
    const valorPagoDiretamente = parseFloat(valorPagoDiretamenteInput.value) || 0;
    const noitesExtra = parseInt(noitesExtraInput.value) || 0;
    const noitesCriancas = parseInt(noitesCriancasInput.value) || 0;

    // Validações
    if (
        !apartamento ||
        isNaN(valorTmtPorNoite) || valorTmtPorNoite <= 0 ||
        isNaN(ano) || ano < 2000 ||
        isNaN(mes) || mes < 1 || mes > 12 ||
        isNaN(valorPagoOperador) || valorPagoOperador < 0 ||
        isNaN(valorPagoDiretamente) || valorPagoDiretamente < 0 ||
        isNaN(noitesExtra) || noitesExtra < 0 ||
        isNaN(noitesCriancas) || noitesCriancas < 0
    ) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    try {
        await addDoc(collection(db, "tmt"), {
            apartamento: apartamento,
            valor_tmt_por_noite: valorTmtPorNoite,
            ano: ano,
            mes: mes,
            valor_pago_operador_turistico: valorPagoOperador,
            valor_pago_diretamente: valorPagoDiretamente,
            noites_extra_7_dias: noitesExtra,
            noites_criancas: noitesCriancas,
            timestamp: new Date()
        });
        alert('T.M.T. registrada com sucesso!');
        tmtForm.reset();
        definirAnoMesAtual();
        carregarRelatorio();
    } catch (e) {
        console.error("Erro ao registrar T.M.T.: ", e);
        alert('Ocorreu um erro ao registrar a T.M.T.');
    }
});

/**
 * Função para carregar e exibir o relatório de T.M.T.
 */
async function carregarRelatorio() {
    relatorioTmtDiv.innerHTML = '<p>Carregando relatório...</p>';
    try {
        const q = query(collection(db, "tmt"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        // Estruturar os dados por apartamento
        const dadosPorApartamento = {};

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const apt = data.apartamento;
            if (!dadosPorApartamento[apt]) {
                dadosPorApartamento[apt] = [];
            }
            dadosPorApartamento[apt].push(data);
        });

        let html = '';

        for (const [apartamento, dados] of Object.entries(dadosPorApartamento)) {
            html += `<h3>Apartamento ${apartamento}</h3>`;
            html += '<table>';
            html += '<tr><th>Ano</th><th>Mês</th><th>Estadias</th><th>Estadias Extra 7 dias</th><th>Estadias Crianças</th><th>Total Noites</th><th>Ação</th></tr>';

            // Agrupar por Ano e Mês
            const dadosAgrupados = {};

            dados.forEach((item) => {
                const key = `${item.ano}-${item.mes}`;
                if (!dadosAgrupados[key]) {
                    dadosAgrupados[key] = {
                        ano: item.ano,
                        mes: item.mes,
                        estadias: 0,
                        estadias_extra: 0,
                        estadias_criancas: 0,
                        total_noites: 0,
                        detalhes: []
                    };
                }

                // Calcular Estadias: (Valor pago Operador Turístico + Valor Pago Diretamente) / Valor T.M.T por noite
                const estadias = (item.valor_pago_operador_turistico + item.valor_pago_diretamente) / item.valor_tmt_por_noite;
                dadosAgrupados[key].estadias += estadias;
                dadosAgrupados[key].estadias_extra += item.noites_extra_7_dias;
                dadosAgrupados[key].estadias_criancas += item.noites_criancas;
                dadosAgrupados[key].total_noites += estadias + item.noites_extra_7_dias + item.noites_criancas;
                dadosAgrupados[key].detalhes.push(item);
            });

            // Ordenar os grupos por Ano e Mês
            const chavesOrdenadas = Object.keys(dadosAgrupados).sort((a, b) => {
                const [anoA, mesA] = a.split('-').map(Number);
                const [anoB, mesB] = b.split('-').map(Number);
                if (anoA !== anoB) {
                    return anoA - anoB;
                }
                return mesA - mesB;
            });

            // Exibir os dados agrupados
            chavesOrdenadas.forEach((key) => {
                const grupo = dadosAgrupados[key];
                const nomeMes = obterNomeMes(grupo.mes);
                html += `<tr>
                            <td>${grupo.ano}</td>
                            <td>${nomeMes}</td>
                            <td>${Math.round(grupo.estadias)}</td>
                            <td>${grupo.estadias_extra}</td>
                            <td>${grupo.estadias_criancas}</td>
                            <td>${Math.round(grupo.total_noites)}</td>
                            <td><button class='ver-detalhes' data-detalhes='${JSON.stringify(grupo.detalhes)}'>Ver Detalhes</button></td>
                         </tr>`;
            });
            html += '</table><hr>';
        }

        relatorioTmtDiv.innerHTML = html;

        // Adicionar event listeners para botões de detalhes
        document.querySelectorAll('.ver-detalhes').forEach(button => {
            button.addEventListener('click', () => mostrarDetalhes(button));
        });
    } catch (e) {
        console.error("Erro ao carregar relatório T.M.T.: ", e);
        relatorioTmtDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

/**
 * Função para mostrar detalhes ao clicar no botão de detalhes do mês
 */
function mostrarDetalhes(button) {
    let detalhesDiv = button.nextElementSibling;
    if (detalhesDiv && detalhesDiv.classList.contains('detalhes')) {
        // Se os detalhes já estão visíveis, ocultá-los e mudar o texto do botão
        detalhesDiv.style.display = detalhesDiv.style.display === 'none' ? 'block' : 'none';
        button.textContent = detalhesDiv.style.display === 'none' ? 'Ver Detalhes' : 'Ocultar Detalhes';
    } else {
        // Caso contrário, adicionar os detalhes e mudar o texto do botão
        const detalhes = JSON.parse(button.dataset.detalhes);
        let detailsHtml = "<div class='detalhes'><table><thead><tr><th>Ano</th><th>Mês</th><th>Valor Pago Operador (€)</th><th>Valor Pago Diretamente (€)</th><th>Noites Extra 7 dias</th><th>Noites Crianças</th></tr></thead><tbody>";
        detalhes.forEach(({ ano, mes, valor_pago_operador_turistico, valor_pago_diretamente, noites_extra_7_dias, noites_criancas }) => {
            const nomeMes = obterNomeMes(mes);
            detailsHtml += `
                <tr>
                    <td>${ano}</td>
                    <td>${nomeMes}</td>
                    <td>€ ${valor_pago_operador_turistico.toFixed(2)}</td>
                    <td>€ ${valor_pago_diretamente.toFixed(2)}</td>
                    <td>${noites_extra_7_dias}</td>
                    <td>${noites_criancas}</td>
                </tr>`;
        });
        detailsHtml += "</tbody></table></div>";
        const div = document.createElement("div");
        div.innerHTML = detailsHtml;
        button.parentElement.appendChild(div);
        button.textContent = 'Ocultar Detalhes';
    }
}

/**
 * Função auxiliar para obter o nome do mês a partir do número
 * @param {number} numeroMes - Número do mês (1-12)
 * @returns {string} Nome do mês correspondente
 */
function obterNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[numeroMes - 1] || 'Mês Inválido';
}

// Carregar o relatório ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
});