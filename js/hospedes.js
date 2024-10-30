// hospedes.js

import { db } from '../js/script.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Function to add a comment
async function addComment(guestName) {
    try {
        const commentData = {
            guestName: guestName,
            ratingOption: "",
            faturaOption: "",
            sibaOption: "",
            timestamp: new Date()
        };
        const docRef = await addDoc(collection(db, "comments"), commentData);
        console.log("Comment added with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
}

// Function to load comments
async function loadComments() {
    const commentList = document.getElementById('comment-list');
    if (!commentList) return;

    commentList.innerHTML = '<li>Carregando comentários...</li>';
    
    try {
        const q = query(collection(db, "comments"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        
        commentList.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const comment = doc.data();
            const li = document.createElement('li');
            li.classList.add('comment-item');

            // Guest Name Display
            const guestNameSpan = document.createElement('span');
            guestNameSpan.textContent = comment.guestName;
            guestNameSpan.classList.add('guest-name');

            // Rating Dropdown
            const ratingDropdown = document.createElement('select');
            ratingDropdown.innerHTML = `
                <option value="Não sei" ${comment.ratingOption === 'Não sei' ? 'selected' : ''}>Não sei</option>
                <option value="5 Estrelas" ${comment.ratingOption === '5 Estrelas' ? 'selected' : ''}>5 Estrelas</option>
                <option value="Não escrever!" ${comment.ratingOption === 'Não escrever!' ? 'selected' : ''}>Não escrever!</option>
            `;

            // Fatura Dropdown
            const faturaDropdown = document.createElement('select');
            faturaDropdown.innerHTML = `
                <option value="Não Emitida" ${comment.faturaOption === 'Não Emitida' ? 'selected' : ''}>Não Emitida</option>
                <option value="Emitida" ${comment.faturaOption === 'Emitida' ? 'selected' : ''}>Emitida</option>
            `;

            // SIBA Dropdown
            const sibaDropdown = document.createElement('select');
            sibaDropdown.innerHTML = `
                <option value="Não Enviado" ${comment.sibaOption === 'Não Enviado' ? 'selected' : ''}>Não Enviado</option>
                <option value="Enviado" ${comment.sibaOption === 'Enviado' ? 'selected' : ''}>Enviado</option>
            `;

            // Update Button
            const updateBtn = document.createElement('button');
            updateBtn.textContent = 'Atualizar';
            updateBtn.classList.add('update-btn');
            updateBtn.onclick = async () => {
                try {
                    await updateComment(doc.id, {
                        ratingOption: ratingDropdown.value,
                        faturaOption: faturaDropdown.value,
                        sibaOption: sibaDropdown.value
                    });
                    console.log('Comment updated successfully');
                } catch (error) {
                    console.error('Error updating comment:', error);
                }
            };

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Apagar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = () => deleteComment(doc.id);

            li.appendChild(guestNameSpan);
            li.appendChild(ratingDropdown);
            li.appendChild(faturaDropdown);
            li.appendChild(sibaDropdown);
            li.appendChild(updateBtn);
            li.appendChild(deleteBtn);

            commentList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading comments:", error);
        commentList.innerHTML = '<li>Erro ao carregar comentários</li>';
    }
}

// Function to update a comment
async function updateComment(commentId, updatedFields) {
    try {
        const commentRef = doc(db, "comments", commentId);
        await updateDoc(commentRef, {
            ratingOption: updatedFields.ratingOption,
            faturaOption: updatedFields.faturaOption,
            sibaOption: updatedFields.sibaOption
        });
        console.log('Comment updated successfully');
    } catch (error) {
        console.error("Error updating comment:", error);
    }
}

// Function to delete a comment
async function deleteComment(commentId) {
    try {
        await deleteDoc(doc(db, "comments", commentId));
        await loadComments();
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert('Erro ao apagar comentário');
    }
}

// Event listener for adding a new comment
document.getElementById('comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const guestName = document.getElementById('guest-name').value.trim();

    if (!guestName) {
        alert('Por favor, preencha o nome do hóspede.');
        return;
    }

    try {
        await addComment(guestName);
        document.getElementById('guest-name').value = '';
        await loadComments();
    } catch (error) {
        alert('Erro ao adicionar comentário');
    }
});

// Load comments on page load
document.addEventListener('DOMContentLoaded', loadComments);
