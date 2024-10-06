// compras.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("lista-compras");
    const resumoLista = document.getElementById("resumo-lista");
    const requisitarButton = document.getElementById("requisitar");
    const confirmarEnvioButton = document.getElementById("confirmar-envio");

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
        Object.keys(itensPreDefinidos).forEach(categoria => {
            const secao = document.getElementById(categoria);
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
            });
        });
    }

    adicionarItens();

    // Adiciona eventos de incrementar, decrementar e limpar
    form.querySelectorAll(".item").forEach(item => {
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
    });

    // Gera o resumo da lista de compras
    requisitarButton.addEventListener("click", () => {
        resumoLista.innerHTML = ""; // Limpar resumo anterior
        const itens = form.querySelectorAll(".item");

        itens.forEach(item => {
            const nomeItem = item.querySelector("input[type='text']")?.value || item.querySelector("label")?.innerText;
            const quantidade = parseInt(item.querySelector("input[type='number']").value);
            const local = item.querySelector(".local").value;

            if (quantidade > 0) {
                const li = document.createElement("li");
                li.textContent = `${nomeItem}: ${quantidade} (Local: ${local})`;
                resumoLista.appendChild(li);
            }
        });
    });

    // Confirmação e envio do email
    confirmarEnvioButton.addEventListener("click", () => {
        const resumo = Array.from(resumoLista.children).map(li => li.textContent).join("\n");
        if (resumo) {
            enviarEmailListaCompras(resumo);
        } else {
            alert("Nenhum item selecionado para requisitar.");
        }
    });

    // Função para enviar email usando EmailJS
    function enviarEmailListaCompras(resumo) {
        emailjs.send("service_tuglp9h", "template_4micnki", {
            message: resumo
        }).then(function(response) {
            console.log("E-mail enviado com sucesso!", response.status, response.text);
            alert("Resumo enviado com sucesso!");
        }, function(error) {
            console.error("Erro ao enviar e-mail:", error);
            alert("Erro ao enviar o e-mail. Tente novamente mais tarde.");
        });
    }
});