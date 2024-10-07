// script.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM totalmente carregado e analisado");

    // Apenas uma função simples para testar a interação com o DOM
    function exibirItens() {
        const secoes = document.querySelectorAll("section");
        secoes.forEach(secao => {
            console.log(`Seção: ${secao.querySelector("h2").innerText}`);
            const itens = secao.querySelectorAll("li");
            itens.forEach(item => {
                console.log(`- ${item.innerText}`);
            });
        });
    }

    // Chama a função para exibir os itens no console
    exibirItens();
});