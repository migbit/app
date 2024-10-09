// Import Firestore from Firebase
import { db } from './script.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Function to manage missing messages in Firestore
async function manageMissingMessages() {
    const idiomaSelect = document.getElementById('idioma');
    const missingMessagesContainer = document.getElementById('missing-messages-container');

    // Load missing messages from Firestore
    async function loadMissingMessages() {
        missingMessagesContainer.innerHTML = '<p>Carregando mensagens pendentes...</p>';
        try {
            const q = query(collection(db, "mensagensPendentes"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            let messages = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                messages.push({ ...data, id: doc.id });
            });

            // Create HTML for displaying missing messages
            let html = '<ul>';
            messages.forEach((m) => {
                html += `<li>
                    ${m.descricao} 
                    <button class="btn-limpar" onclick="removeMessage('${m.id}')">Limpar</button>
                </li>`;
            });
            html += '</ul>';

            missingMessagesContainer.innerHTML = html;
        } catch (e) {
            console.error("Erro ao carregar mensagens pendentes: ", e);
            missingMessagesContainer.innerHTML = '<p>Ocorreu um erro ao carregar as mensagens pendentes.</p>';
        }
    }

    // Add new missing message
    idiomaSelect.addEventListener('change', async () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            try {
                await addDoc(collection(db, "mensagensPendentes"), {
                    descricao: `Falta adicionar mensagem para o idioma: ${idioma}`,
                    timestamp: new Date()
                });
                loadMissingMessages();
            } catch (e) {
                console.error("Erro ao adicionar mensagem pendente: ", e);
            }
        }
    });

    // Remove a message from Firestore
    window.removeMessage = async (id) => {
        try {
            await deleteDoc(doc(db, "mensagensPendentes", id));
            loadMissingMessages();
        } catch (e) {
            console.error("Erro ao remover mensagem pendente: ", e);
        }
    };

    // Load the missing messages when the page loads
    document.addEventListener('DOMContentLoaded', loadMissingMessages);
}

// Initialize the missing message management
manageMissingMessages();