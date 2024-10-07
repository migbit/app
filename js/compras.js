// script.js
const itensPreDefinidos = {
    "produtos-limpeza": [
        "Lixívia tradicional",
        "Multiusos com Lixívia",
        "Gel com Lixívia",
        "CIF",
        "Limpeza Chão (Lava Tudo)",
        "Limpeza Chão (Madeira)",
        "Limpa Vidros",
        "Limpeza Potente",
        "Limpeza Placas",
        "Vinagre"
    ],
    "roupa": [
        "Detergente Roupa",
        "Amaciador",
        "Lixívia Roupa Branca",
        "Tira Nódoas",
        "Tira Gorduras",
        "Oxi Active",
        "Branqueador"
    ],
    "wc": [
        "Papel Higiénico",
        "Gel WC Sanitas",
        "Toalhitas",
        "Toalhitas Desmaquilhantes",
        "Blocos Sanitários",
        "Anticalcário",
        "Limpeza Chuveiro",
        "Desentupidor de Canos",
        "Manutenção Canos",
        "Papel Higiénico Húmido"
    ],
    "cozinha": [
        "Água 1.5l",
        "Água 5l",
        "Café",
        "Rolo de Cozinha",
        "Guardanapos",
        "Bolachas",
        "Chá",
        "Lava-Loiça",
        "Esfregões",
        "Película Transparente",
        "Papel Alumínio",
        "Sacos congelação"
    ],
    "diversos": [
        "Varetas Difusoras (Ambientador)"
    ]
};

function createItemElement(nomeItem) {
    const divItem = document.createElement("div");
    divItem.classList.add("item");

    divItem.innerHTML = `
        <label>${nomeItem}</label>
        <input type="number" value="0" min="0">
        <button type="button" class="incrementar">+</button>
        <button type="button" class="decrementar">-</button>
        <button type="button" class="limpar">Limpar</button>
        <select class="local">
            <option value="local" selected>Local</option>
            <option value="123">123</option>
            <option value="1248">1248</option>
            <option value="escritorio">Escritório</option>
            <option value="lavandaria">Lavandaria</option>
            <option value="casa">Casa</option>
        </select>
    `;

    return divItem;
}

function addEventListeners(itemElement) {
    const incrementarButton = itemElement.querySelector(".incrementar");
    const decrementarButton = itemElement.querySelector(".decrementar");
    const limparButton = itemElement.querySelector(".limpar");
    const quantidadeInput = itemElement.querySelector("input[type='number']");

    incrementarButton.addEventListener("click", () => {
        quantidadeInput.value = parseInt(quantidadeInput.value) + 1;
    });

    decrementarButton.addEventListener("click", () => {
        if (parseInt(quantidadeInput.value) > 0) {
            quantidadeInput.value = parseInt(quantidadeInput.value) - 1;
        }
    });

    limparButton.addEventListener("click", () => {
        quantidadeInput.value = 0;
        itemElement.querySelector(".local").value = "local";
    });
}

function initializeShoppingList() {
    Object.entries(itensPreDefinidos).forEach(([categoria, items]) => {
        const section = document.getElementById(categoria);
        if (!section) {
            console.error(`Section ${categoria} not found`);
            return;
        }

        items.forEach(item => {
            const itemElement = createItemElement(item);
            addEventListeners(itemElement);
            section.appendChild(itemElement);
        });
    });

    const requisitarButton = document.getElementById("requisitar");
    if (requisitarButton) {
        requisitarButton.addEventListener("click", generateSummary);
    }
}

function generateSummary() {
    const resumoLista = document.getElementById("resumo-lista");
    if (!resumoLista) {
        console.error("Resumo lista element not found");
        return;
    }

    resumoLista.innerHTML = "";

    Object.keys(itensPreDefinidos).forEach(categoria => {
        const section = document.getElementById(categoria);
        if (!section) return;

        const items = section.querySelectorAll(".item");
        items.forEach(item => {
            const nomeItem = item.querySelector("label").textContent;
            const quantidade = parseInt(item.querySelector("input[type='number']").value);
            const local = item.querySelector(".local").value;

            if (quantidade > 0) {
                const li = document.createElement("li");
                li.textContent = `${nomeItem}: ${quantidade} (Local: ${local})`;
                resumoLista.appendChild(li);
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing shopping list...");
    initializeShoppingList();
});