// compras.js

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("lista-compras");
    const resumoLista = document.getElementById("resumo-lista");
    const requisitarButton = document.getElementById("requisitar");
    const confirmarEnvioButton = document.getElementById("confirmar-envio");

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