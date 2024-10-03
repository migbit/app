// js/teste.js

import { db } from './script.js'; // Importar Firestore do script principal
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const testeForm = document.getElementById('teste-form');
const dadosRegistradosDiv = document.getElementById('dados-registrados');

// Função para adicionar um dado de teste
testeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const testeDado = document.getElementById('teste-dado').value.trim();

    if (!testeDado) {
        alert('Por favor, insira um dado válido.');
        return;
    }

    try {
        await addDoc(collection(db, "teste"), {
            dado: testeDado,
            timestamp: new Date()
        });
        alert('Dado registrado com sucesso!');
        testeForm.reset();
        carregarDados();
    } catch (e) {
        console.error("Erro ao registrar dado: ", e);
        alert('Ocorreu um erro ao registrar o dado.');
    }
});

// Função para carregar e exibir os dados registrados
async function carregarDados() {
    dadosRegistradosDiv.innerHTML = '<p>Carregando dados...</p>';
    try {
        const querySnapshot = await getDocs(collection(db, "teste"));
        let html = '<ul>';
        querySnapshot.forEach((doc) => {
            html += `<li>${doc.data().dado} - ${doc.data().timestamp.toDate().toLocaleString()}</li>`;
        });
        html += '</ul>';
        dadosRegistradosDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar dados: ", e);
        dadosRegistradosDiv.innerHTML = '<p>Ocorreu um erro ao carregar os dados.</p>';
    }
}

// Carregar os dados ao iniciar
carregarDados();
