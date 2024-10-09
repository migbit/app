// js/mensagens.js

// Load the JSON data
document.addEventListener('DOMContentLoaded', () => {
    fetch('./mensagensData.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            initializeMessageSelectors(data);
        })
        .catch(error => {
            console.error('Error fetching the JSON data:', error);
        });
});

// Function to initialize selectors and events
function initializeMessageSelectors(mensagens) {
    // Selecionar elementos do DOM
    const idiomaSelect = document.getElementById('idioma');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaSelect = document.getElementById('categoria');
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');

    // Evento para quando o idioma for selecionado
    idiomaSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            categoriaDiv.style.display = 'block';
            opcaoDiv.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
            mensagemSecao.style.display = 'none';
        } else {
            categoriaDiv.style.display = 'none';
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento para quando a categoria for selecionada
    categoriaSelect.addEventListener('change', () => {
        const categoria = categoriaSelect.value;
        if (categoria) {
            opcaoDiv.style.display = 'block';
            mensagemSecao.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';

            const opcoes = Object.keys(mensagens[categoria]);
            opcoes.forEach(opcao => {
                const option = document.createElement('option');
                option.value = opcao;
                option.textContent = opcao;
                opcaoSelect.appendChild(option);
            });
        } else {
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento para quando a opção for selecionada
    opcaoSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (opcao && mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][idioma]) {
            const mensagem = mensagens[categoria][opcao][idioma];
            mensagemContainer.innerHTML = mensagem;
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento para copiar a mensagem ao clicar no container
    mensagemContainer.addEventListener('click', async () => {
        const mensagemHTML = mensagemContainer.innerHTML;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([mensagemHTML], { type: 'text/html' })
                })
            ]);
            alert('Mensagem copiada para a área de transferência com formatação!');
        } catch (err) {
            console.error('Erro ao copiar a mensagem: ', err);
        }
    });
}
