// compras.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM totalmente carregado e analisado");

    const form = document.getElementById("lista-compras");
    const resumoLista = document.getElementById("resumo-lista");
    const requisitarButton = document.getElementById("requisitar");

    // Lista pré-definida de itens
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

    // Função para adicionar itens ao formulário
    function adicionarItens() {
        console.log("Adicionando itens ao formulário...");
        Object.keys(itensPreDefinidos).forEach(categoria => {
            const secao = document.getElementById(categoria);
            if (secao) {
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
                    console.log(`Item "${nomeItem}" adicionado na seção "${categoria}"`);
                });
            } else {
                console.error(`Seção "${categoria}" não encontrada no DOM.`);
            }
        });
    }

    adicionarItens();

    // Adiciona eventos de incrementar, decrementar e limpar
    function adicionarEventosItem(item) {
        const incrementarButton = item.querySelector(".incrementar");
        const decrementarButton = item.querySelector(".decrementar");
        const limparButton = item.querySelector(".limpar");
        const quantidadeInput = item.querySelector("input[type='number']");

        incrementarButton.addEventListener("click", () => {
            quantidadeInput.value = parseInt(quantidadeInput.value) + 1;
        });

        decrementarButton.addEventListener("click", () => {
            if (quantidadeInput.value > 0) {
                quantidadeInput.value = parseInt(quantidadeInput.value) - 1;
            }
        });

        limparButton.addEventListener("click", () => {
            quantidadeInput.value = 0;
            item.querySelector(".local").value = "local";
        });
    }

    // Adiciona os eventos para os itens após serem adicionados ao DOM
    form.querySelectorAll(".item").forEach(item => {
        adicionarEventosItem(item);
    });

    // Gera o resumo da lista de compras
    requisitarButton.addEventListener("click", () => {
        resumoLista.innerHTML = ""; // Limpar resumo anterior
        const itens = form.querySelectorAll(".item");

        itens.forEach(item => {
            const nomeItem = item.querySelector("label")?.innerText;
            const quantidade = parseInt(item.querySelector("input[type='number']").value);
            const local = item.querySelector(".local").value;

            if (quantidade > 0) {
                const li = document.createElement("li");
                li.textContent = `${nomeItem}: ${quantidade} (Local: ${local})`;
                resumoLista.appendChild(li);
            }
        });
    });
});