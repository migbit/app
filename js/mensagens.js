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
    // Language buttons
    const buttons = {
        "btn-portugues": "Português",
        "btn-ingles": "Inglês",
        "btn-espanhol": "Espanhol",
        "btn-frances": "Francês",
        "btn-alemao": "Alemão",
        "btn-italiano": "Italiano"
    };

    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaSelect = document.getElementById('categoria');
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');
    
    let selectedIdioma = "";  // Store selected language

    // Event listener for each language button
    Object.keys(buttons).forEach(buttonId => {
        document.getElementById(buttonId).addEventListener('click', (event) => {
            selectedIdioma = buttons[buttonId];  // Store the selected language
            categoriaDiv.style.display = 'block';
            opcaoDiv.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
            mensagemSecao.style.display = 'none';

            // Remove active class from other buttons and add to the clicked one
            document.querySelectorAll('.language-buttons button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        });
    });

    // Event for when a category is selected
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

    // Event for when an option is selected
    opcaoSelect.addEventListener('change', () => {
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (opcao && mensagens[categoria] && mensagens[categoria][opcao] && mensagens[categoria][opcao][selectedIdioma]) {
            const mensagem = mensagens[categoria][opcao][selectedIdioma];
            mensagemContainer.innerHTML = mensagem;
            mensagemSecao.style.display = 'block';
        } else {
            mensagemSecao.style.display = 'none';
        }
    });

    // Event to copy the message when the container is clicked
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
