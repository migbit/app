// js/compras.js

import { db } from './script.js';
import { collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM totalmente carregado e analisado");
    
    const listaCompras = document.getElementById("lista-compras");
    const addItemForm = document.getElementById("add-item-form");

    if (!listaCompras) {
        console.error("Elemento 'lista-compras' não encontrado no DOM.");
        return;
    }
    
    if (!addItemForm) {
        console.error("Formulário 'add-item-form' não encontrado no DOM.");
        return;
    }

    console.log("Iniciando a obtenção dos itens do Firestore...");

    try {
        // Fetch existing items from Firestore
        const querySnapshot = await getDocs(collection(db, "compras"));
        console.log(`Foram encontrados ${querySnapshot.size} itens no Firestore.`);

        querySnapshot.forEach((documento) => {
            const data = documento.data();
            console.log("Dados do item:", data);

            const itemDiv = document.createElement("div");
            itemDiv.classList.add("item");

            itemDiv.innerHTML = `
                <label>${data.nome}</label>
                <input type="number" value="${data.quantidade}" min="0" data-id="${documento.id}">
                <button type="button" class="incrementar">+</button>
                <button type="button" class="decrementar">-</button>
                <button type="button" class="limpar">Limpar</button>
            `;
            listaCompras.appendChild(itemDiv);

            // Add event listeners for the buttons
            const incrementarButton = itemDiv.querySelector(".incrementar");
            const decrementarButton = itemDiv.querySelector(".decrementar");
            const limparButton = itemDiv.querySelector(".limpar");
            const quantidadeInput = itemDiv.querySelector("input[type='number']");

            incrementarButton.addEventListener("click", async () => {
                quantidadeInput.value = parseInt(quantidadeInput.value) + 1;
                try {
                    await updateDoc(doc(db, "compras", documento.id), {
                        quantidade: parseInt(quantidadeInput.value)
                    });
                    console.log(`Quantidade do item '${data.nome}' atualizada para ${quantidadeInput.value}`);
                } catch (e) {
                    console.error("Erro ao atualizar quantidade: ", e);
                }
            });

            decrementarButton.addEventListener("click", async () => {
                if (quantidadeInput.value > 0) {
                    quantidadeInput.value = parseInt(quantidadeInput.value) - 1;
                    try {
                        await updateDoc(doc(db, "compras", documento.id), {
                            quantidade: parseInt(quantidadeInput.value)
                        });
                        console.log(`Quantidade do item '${data.nome}' atualizada para ${quantidadeInput.value}`);
                    } catch (e) {
                        console.error("Erro ao atualizar quantidade: ", e);
                    }
                }
            });

            limparButton.addEventListener("click", async () => {
                quantidadeInput.value = 0;
                try {
                    await updateDoc(doc(db, "compras", documento.id), {
                        quantidade: 0
                    });
                    console.log(`Quantidade do item '${data.nome}' foi resetada para 0.`);
                } catch (e) {
                    console.error("Erro ao resetar quantidade: ", e);
                }
            });
        });
    } catch (e) {
        console.error("Erro ao carregar itens de compras: ", e);
    }

    // Adicionar um novo item à lista de compras
    addItemForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const itemName = document.getElementById("item-nome").value;
        const itemQuantidade = parseInt(document.getElementById("item-quantidade").value);

        if (!itemName || isNaN(itemQuantidade) || itemQuantidade < 0) {
            alert("Por favor, insira um nome e uma quantidade válida.");
            return;
        }

        console.log(`Tentando adicionar o item: ${itemName} com quantidade: ${itemQuantidade}`);

        try {
            await addDoc(collection(db, "compras"), {
                nome: itemName,
                quantidade: itemQuantidade
            });
            alert("Item adicionado com sucesso!");
            window.location.reload(); // Recarrega a página para atualizar a lista de itens
        } catch (e) {
            console.error("Erro ao adicionar item: ", e);
            alert("Ocorreu um erro ao adicionar o item.");
        }
    });
});