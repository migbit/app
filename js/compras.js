document.addEventListener("DOMContentLoaded", () => {
    console.log("Script started");

    const form = document.getElementById("lista-compras");
    if (!form) {
        console.error("Form not found!");
        return;
    }
    console.log("Form found");

    // Lista pré-definida de itens
    const itensPreDefinidos = {
        "produtos-limpeza": [
            "Lixívia tradicional",
            "Multiusos com Lixívia",
            "Gel com Lixívia",
            "CIF",
            "Limpeza Chão (Lava Tudo)"
        ],
        "roupa": [
            "Detergente Roupa",
            "Amaciador",
            "Lixívia Roupa Branca"
        ],
        "wc": [
            "Papel Higiénico",
            "Gel WC Sanitas",
            "Toalhitas"
        ],
        "cozinha": [
            "Água 1.5l",
            "Água 5l",
            "Café"
        ],
        "diversos": [
            "Varetas Difusoras (Ambientador)"
        ]
    };

    // Função para adicionar itens ao formulário
    function adicionarItens() {
        console.log("Starting to add items");
        Object.keys(itensPreDefinidos).forEach(categoria => {
            console.log(`Processing category: ${categoria}`);
            const secao = document.getElementById(categoria);
            
            if (!secao) {
                console.error(`Section not found: ${categoria}`);
                return;
            }
            
            console.log(`Found section: ${categoria}`);
            
            itensPreDefinidos[categoria].forEach(nomeItem => {
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

                secao.appendChild(divItem);
                console.log(`Added item: ${nomeItem} to ${categoria}`);
            });
        });
    }

    // Tentar adicionar itens
    try {
        adicionarItens();
        console.log("Items added successfully");
    } catch (error) {
        console.error("Error adding items:", error);
    }
});