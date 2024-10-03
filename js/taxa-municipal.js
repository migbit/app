// js/taxa-municipal.js

// Importar funções necessárias do Firebase
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Inicializar Firestore (já está inicializado no script.js se você o estiver usando para outros módulos)
const db = getFirestore();

// Selecionar elementos do DOM
const taxaForm = document.getElementById('taxa-form');
const relatoriosDiv = document.getElementById('relatorios');

// Evento de submissão do formulário
taxaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obter valores do formulário
    const valorReserva = parseFloat(document.getElementById('valor-reserva').value);
    const mes = parseInt(document.getElementById('mes').value);
    const ano = parseInt(document.getElementById('ano').value);
    const noitesExcedidas = parseInt(document.getElementById('noites-excedidas').value);
    const noitesCriancas = parseInt(document.getElementById('noites-criancas').value);

    // Cálculos automáticos
    const noitesPagas = valorReserva / 2;
    const trimestre = Math.ceil(mes / 3);

    // Dados para registrar
    const taxaData = {
        valor_total: valorReserva,
        mes: mes,
        ano: ano,
        noites_pagadas: noitesPagas,
        noites_excedidas: noitesExcedidas,
        noites_criancas: noitesCriancas,
        trimestre: trimestre
    };

    try {
        // Adicionar documento na coleção 'taxa_municipal'
        const docRef = await addDoc(collection(db, "taxa_municipal"), taxaData);
        alert("Taxa Municipal Turística registrada com sucesso!");
        taxaForm.reset();
        carregarRelatorios();
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        alert("Ocorreu um erro ao registrar a taxa. Tente novamente.");
    }
});

// Função para carregar relatórios trimestrais
async function carregarRelatorios() {
    // Obter todos os documentos da coleção 'taxa_municipal'
    const querySnapshot = await getDocs(collection(db, "taxa_municipal"));

    // Agregar dados por trimestre
    const relatorios = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const tr = data.trimestre;
        if (!relatorios[tr]) {
            relatorios[tr] = {
                noites_pagadas: 0,
                noites_excedidas: 0,
                noites_criancas: 0
            };
        }
        relatorios[tr].noites_pagadas += data.noites_pagadas;
        relatorios[tr].noites_excedidas += data.noites_excedidas;
        relatorios[tr].noites_criancas += data.noites_criancas;
    });

    // Exibir os relatórios
    let html = "";
    for (const [trimestre, valores] of Object.entries(relatorios)) {
        html += `
            <div class="relatorio-trimestre">
                <h3>Trimestre ${trimestre}</h3>
                <p>Noites Pagas através da AirBnB: ${valores.noites_pagadas.toFixed(2)}</p>
                <p>Noites Excedidas além das 7 gratuitas: ${valores.noites_excedidas}</p>
                <p>Noites para Crianças (até 13 anos): ${valores.noites_criancas}</p>
            </div>
            <hr>
        `;
    }

    relatoriosDiv.innerHTML = html;
}

// Carregar relatórios ao carregar a página
window.onload = carregarRelatorios;
