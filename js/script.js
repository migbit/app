// js/script.js

// Defina funções ou variáveis globais, se necessário

// Exemplo: Função para copiar texto
function copiarMensagem(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Exportar a função se necessário
export { copiarMensagem };
