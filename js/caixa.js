// js/caixa.js

// Importar funções necessárias do Firebase
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Selecionar elementos do DOM
const caixaForm = document.getElementById('caixa-form');
const relatoriosDiv = document.getElementById('relatorios-caixa');

// Evento para submissão do formulário
caixaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const descricao = document.getElementById('descricao').value;
    const tipo = document.getElementById('tipo').value;
    const valor = parseFloat(document.getElementById('valor').value);

    // Criar objeto de dados
    const caixaData = {
        descricao: descricao,
        tipo: tipo,
        valor: valor,
        data: new Date()
    };

    try {
        // Adicionar documento à coleção 'caixa'
        await addDoc(collection(db, "caixa"), caixaData);
        alert('Transação registrada com sucesso!');
        caixaForm.reset();
        carregarRelatorios();
    } catch (e) {
        console.error("Erro ao adicionar transação: ", e);
    }
});

// Função para carregar relatórios de caixa
async function carregarRelatorios() {
    relatoriosDiv.innerHTML = '<p>Carregando relatórios...</p>';

   
