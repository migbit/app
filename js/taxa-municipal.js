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
            html += '<tr><th>Ano</th><th>Mês</th><th>Estadias</th><th>Estadias Extra 7 dias</th><th>Estadias Crianças</th><th>Total Noites</th></tr>';

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
                        total_noites: 0
                    };
                }

                // Calcular Estadias: (Valor pago Operador Turístico + Valor Pago Diretamente) / Valor T.M.T por noite
                const estadias = (item.valor_pago_operador_turistico + item.valor_pago_diretamente) / item.valor_tmt_por_noite;
                dadosAgrupados[key].estadias += estadias;
                dadosAgrupados[key].estadias_extra += item.noites_extra_7_dias;
                dadosAgrupados[key].estadias_criancas += item.noites_criancas;
                dadosAgrupados[key].total_noites += estadias + item.noites_extra_7_dias + item.noites_criancas;
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
                            <td>${grupo.estadias.toFixed(2)}</td>
                            <td>${grupo.estadias_extra}</td>
                            <td>${grupo.estadias_criancas}</td>
                            <td>${grupo.total_noites.toFixed(2)}</td>
                         </tr>`;
            });
            html += '</table>';

            // Calcular Totais por Mês e por Trimestre
            const totaisPorMes = {};
            const totaisPorTrimestre = {};

            chavesOrdenadas.forEach((key) => {
                const grupo = dadosAgrupados[key];
                // Totais por Mês
                totaisPorMes[key] = {
                    estadias: grupo.estadias,
                    estadias_extra: grupo.estadias_extra,
                    estadias_criancas: grupo.estadias_criancas,
                    total_noites: grupo.total_noites
                };

                // Totais por Trimestre
                const trimestre = obterTrimestre(grupo.mes);
                if (!totaisPorTrimestre[trimestre]) {
                    totaisPorTrimestre[trimestre] = {
                        estadias: 0,
                        estadias_extra: 0,
                        estadias_criancas: 0,
                        total_noites: 0
                    };
                }

                totaisPorTrimestre[trimestre].estadias += grupo.estadias;
                totaisPorTrimestre[trimestre].estadias_extra += grupo.estadias_extra;
                totaisPorTrimestre[trimestre].estadias_criancas += grupo.estadias_criancas;
                totaisPorTrimestre[trimestre].total_noites += grupo.total_noites;
            });

            // Exibir Totais por Mês
            html += '<h4>Total por Mês</h4>';
            html += '<table>';
            html += '<tr><th>Ano-Mês</th><th>Estadias</th><th>Estadias Extra 7 dias</th><th>Estadias Crianças</th><th>Total Noites</th></tr>';
            for (const [key, total] of Object.entries(totaisPorMes)) {
                const [ano, mes] = key.split('-').map(Number);
                const nomeMes = obterNomeMes(mes);
                html += `<tr>
                            <td>${ano} - ${nomeMes}</td>
                            <td>${total.estadias.toFixed(2)}</td>
                            <td>${total.estadias_extra}</td>
                            <td>${total.estadias_criancas}</td>
                            <td>${total.total_noites.toFixed(2)}</td>
                         </tr>`;
            }
            html += '</table>';

            // Exibir Totais por Trimestre
            html += '<h4>Total por Trimestre</h4>';
            html += '<table>';
            html += '<tr><th>Trimestre</th><th>Estadias</th><th>Estadias Extra 7 dias</th><th>Estadias Crianças</th><th>Total Noites</th></tr>';
            for (const [trimestre, total] of Object.entries(totaisPorTrimestre)) {
                html += `<tr>
                            <td>${trimestre}</td>
                            <td>${total.estadias.toFixed(2)}</td>
                            <td>${total.estadias_extra}</td>
                            <td>${total.estadias_criancas}</td>
                            <td>${total.total_noites.toFixed(2)}</td>
                         </tr>`;
            }
            html += '</table>';

            html += '<hr>';
        }

        relatorioTmtDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar relatório T.M.T.: ", e);
        relatorioTmtDiv.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
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

/**
 * Função auxiliar para obter o trimestre a partir do mês
 * @param {number} numeroMes - Número do mês (1-12)
 * @returns {string} Nome do trimestre correspondente
 */
function obterTrimestre(numeroMes) {
    if (numeroMes >= 1 && numeroMes <= 3) return '1º Trimestre (Jan-Mar)';
    if (numeroMes >= 4 && numeroMes <= 6) return '2º Trimestre (Abr-Jun)';
    if (numeroMes >= 7 && numeroMes <= 9) return '3º Trimestre (Jul-Set)';
    if (numeroMes >= 10 && numeroMes <= 12) return '4º Trimestre (Out-Dez)';
    return 'Trimestre Inválido';
}

// Carregar o relatório ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarRelatorio();
});
