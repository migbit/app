// js/tarefas.js

// Importar a instância do Firestore do script.js
import { db } from './script.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const tarefaForm = document.getElementById('tarefa-form');
const listaTarefasDiv = document.getElementById('lista-tarefas');

// Função para adicionar uma nova tarefa
tarefaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tarefa = document.getElementById('tarefa').value;

    if (!tarefa) {
        alert('Por favor, insira uma tarefa válida.');
        return;
    }

    try {
        await addDoc(collection(db, "tarefas"), {
            descricao: tarefa,
            timestamp: new Date()
        });
        alert('Tarefa adicionada com sucesso!');
        tarefaForm.reset();
        carregarTarefas();
    } catch (e) {
        console.error("Erro ao adicionar tarefa: ", e);
        alert('Ocorreu um erro ao adicionar a tarefa.');
    }
});

// Função para carregar e exibir a lista de tarefas
async function carregarTarefas() {
    listaTarefasDiv.innerHTML = '<p>Carregando tarefas...</p>';
    try {
        const q = query(collection(db, "tarefas"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        let tarefas = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            tarefas.push({ ...data, id: doc.id });
        });

        // Criar HTML para exibir as tarefas
        let html = '<ul>';
        tarefas.forEach((t) => {
            const date = t.timestamp.toDate().toLocaleDateString('pt-PT');
            html += `<li>
                ${t.descricao} <small>(${date})</small>
                <button class="btn-apagar" onclick="removerTarefa('${t.id}')">Apagar</button>
            </li>`;
        });
        html += '</ul>';

        listaTarefasDiv.innerHTML = html;
    } catch (e) {
        console.error("Erro ao carregar tarefas: ", e);
        listaTarefasDiv.innerHTML = '<p>Ocorreu um erro ao carregar as tarefas.</p>';
    }
}

// Função para remover uma tarefa
window.removerTarefa = async (id) => {
    try {
        await deleteDoc(doc(db, "tarefas", id));
        alert('Tarefa removida com sucesso!');
        carregarTarefas();
    } catch (e) {
        console.error("Erro ao remover tarefa: ", e);
        alert('Ocorreu um erro ao remover a tarefa.');
    }
};

// Carregar a lista de tarefas ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarTarefas();
});
