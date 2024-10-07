// js/firebase_script.js

import { db } from "./script.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const listaCompras = document.getElementById("lista-compras");

    // Fetch existing items from Firestore
    const querySnapshot = await getDocs(collection(db, "compras"));
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("item");

        itemDiv.innerHTML = `
            <label>${data.nome}</label>
            <input type="number" value="${data.quantidade}" min="0" data-id="${doc.id}">
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
            await updateDoc(doc(db, "compras", doc.id), {
                quantidade: parseInt(quantidadeInput.value)
            });
        });

        decrementarButton.addEventListener("click", async () => {
            if (quantidadeInput.value > 0) {
                quantidadeInput.value = parseInt(quantidadeInput.value) - 1;
                await updateDoc(doc(db, "compras", doc.id), {
                    quantidade: parseInt(quantidadeInput.value)
                });
            }
        });

        limparButton.addEventListener("click", async () => {
            quantidadeInput.value = 0;
            await updateDoc(doc(db, "compras", doc.id), {
                quantidade: 0
            });
        });
    });
});