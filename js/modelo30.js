// js/modelo30.js

import { db } from './script.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// DOM Elements
const modelo30Form = document.getElementById('modelo30-form');
const relatorioModelo30Div = document.getElementById('relatorio-modelo30');
const anoInput = document.getElementById('ano');
const mesSelect = document.getElementById('mes');
const valorInput = document.getElementById('valor');

// Initialize form with current year and month
function initializeForm() {
    const today = new Date();
    anoInput.value = today.getFullYear();
    mesSelect.value = today.getMonth() + 1; // getMonth() returns 0-11
}

// Add Modelo 30 entry
async function addModelo30Entry(e) {
    e.preventDefault();

    const ano = parseInt(anoInput.value);
    const mes = parseInt(mesSelect.value);
    const valor = parseFloat(valorInput.value);

    if (isNaN(ano) || isNaN(mes) || isNaN(valor) || ano < 2000 || mes < 1 || mes > 12 || valor <= 0) {
        alert('Por favor, insira dados válidos.');
        return;
    }

    try {
        await addDoc(collection(db, "modelo30"), {
            ano,
            mes,
            valor,
            timestamp: new Date()
        });
        alert('Modelo 30 registrado com sucesso!');
        modelo30Form.reset();
        initializeForm();
        loadReport();
    } catch (error) {
        console.error("Erro ao registrar Modelo 30: ", error);
        alert('Ocorreu um erro ao registrar o Modelo 30.');
    }
}

// Load and display Modelo 30 report
async function loadReport() {
    relatorioModelo30Div.innerHTML = '<p>Carregando relatório...</p>';
    try {
        const q = query(collection(db, "modelo30"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const groupedData = {};

        querySnapshot.forEach((doc) => {
            const { ano, mes, valor } = doc.data();
            const key = `${ano}-${mes}`;
            if (!groupedData[key]) {
                groupedData[key] = { ano, mes, valor };
            } else {
                groupedData[key].valor += valor;
            }
        });

        const sortedData = Object.values(groupedData).sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            return b.mes - a.mes;
        });

        const tableHTML = generateReportTable(sortedData);
        relatorioModelo30Div.innerHTML = tableHTML;
    } catch (error) {
        console.error("Erro ao carregar relatório Modelo 30: ", error);
        relatorioModelo30Div.innerHTML = '<p>Ocorreu um erro ao carregar o relatório.</p>';
    }
}

// Generate HTML table for the report
function generateReportTable(data) {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Ano</th>
                    <th>Mês</th>
                    <th>Valor Total (€)</th>
                </tr>
            </thead>
            <tbody>
    `;
    data.forEach(({ ano, mes, valor }) => {
        html += `
            <tr>
                <td>${ano}</td>
                <td>${getMonthName(mes)}</td>
                <td>${valor.toFixed(2)}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    return html;
}

// Get month name from month number
function getMonthName(monthNumber) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNumber - 1] || 'Mês Inválido';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    loadReport();
});

modelo30Form.addEventListener('submit', addModelo30Entry);

// Export functions for potential use in other modules
export { loadReport, initializeForm };