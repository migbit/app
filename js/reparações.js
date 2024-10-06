// js/reparacoes.js

import { db, enviarEmailUrgencia } from './script.js';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Selecionar elementos do DOM
const reparacoesForm = document.getElementById('reparacoes-form');
const listaReparacoesDiv = document.getElementById('lista-reparacoes');

// Adicionar uma nova reparação
reparacoesForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apartamento = document.getElementById('apartamento').value;
    const descricao = document.getElementById('descricao').value;
    const urgencia = document.getElementById('urgencia').value;

    if (!apartamento || !descricao || !urgencia) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const novaReparacao = {
            apartamento,
            descricao,
            urgencia,
            material_comprado: false,
            reparado: false,
            timestamp: new Date()
        };

        const docRef = await addDoc(collection(db, "reparacoes"), novaReparacao);
        console.log("Reparação registrada com ID: ", docRef.id); // Log para verificar se o registro foi salvo com sucesso

        alert('Reparação registrada com sucesso!');
        reparacoesForm.reset();
        await carregarReparacoes();

        // Enviar e-mail de urgência se necessário
        if (urgencia === 'alta') {
            console.log("Enviando e-mail de urgência...");
            enviarEmailUrgencia(
                'apartments.oporto@gmail.com',
                'Reparação Urgente Necessária',
                `Uma nova reparação urgente foi registrada no apartamento ${apartamento}: ${descricao}`
            );
        }
    } catch (error) {
        console.error("Erro ao registrar reparação: ", error);
        alert('Ocorreu um erro ao registrar a reparação.');
    }
});

// Carregar e exibir as reparações
async function carregarReparacoes() {
    listaReparacoesDiv.innerHTML = '<p>Carregando reparações...</p>';
    try {
        const q = query(collection(db, "reparacoes"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        let reparacoesPendentesHtml = '<h3>Reparações Pendentes</h3><ul>';
        let reparacoesConcluidasHtml = '<h3>Reparações Concluídas</h3><ul>';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            const isConcluido = data.reparado;
            const classReparado = isConcluido ? 'reparado' : '';
            const timestamp = data.timestamp.toDate();
            const dataFormatada = timestamp.toLocaleString('pt-PT');

            const reparacaoHtml = `
                <li class="${classReparado}">
                    <strong>Apartamento ${data.apartamento}</strong> 
                    <p>${data.descricao}</p>
                    <p>Urgência: ${data.urgencia} | Data: ${dataFormatada}</p>
                    <div>
                        <label>
                            <input type="checkbox" ${data.material_comprado ? 'checked' : ''} 
                                   onchange="atualizarStatus('${id}', 'material_comprado', this.checked)">
                            Material Comprado
                        </label>
                        <label>
                            <input type="checkbox" ${data.reparado ? 'checked' : ''} 
                                   onchange="atualizarStatus('${id}', 'reparado', this.checked)">
                            Reparado
                        </label>
                    </div>
                </li>
            `;

            if (isConcluido) {
                reparacoesConcluidasHtml += reparacaoHtml;
            } else {
                reparacoesPendentesHtml += reparacaoHtml;
            }
        });

        reparacoesPendentesHtml += '</ul>';
        reparacoesConcluidasHtml += '</ul>';

        listaReparacoesDiv.innerHTML = reparacoesPendentesHtml + reparacoesConcluidasHtml;
    } catch (error) {
        console.error("Erro ao carregar reparações: ", error);
        listaReparacoesDiv.innerHTML = '<p>Ocorreu um erro ao carregar a lista de reparações.</p>';
    }
}

// Função para atualizar o status da reparação
window.atualizarStatus = async (id, campo, valor) => {
    try {
        const reparacaoRef = doc(db, "reparacoes", id);
        await updateDoc(reparacaoRef, { [campo]: valor });
        console.log(`Status da reparação atualizado: ${campo} = ${valor}`); // Log para verificar se o status foi atualizado corretamente
        await carregarReparacoes();
    } catch (error) {
        console.error("Erro ao atualizar status da reparação: ", error);
        alert('Ocorreu um erro ao atualizar o status da reparação.');
    }
};

// Carregar reparações ao iniciar
document.addEventListener('DOMContentLoaded', carregarReparacoes);
