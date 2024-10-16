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
        "btn-frances": "Francês"
    };

    const languageButtonsDiv = document.querySelector('.language-buttons-vertical');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaContainer = document.getElementById('categoria-container'); // New container for category buttons
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');
    const backButton = document.createElement('button'); // Create Back button

    let selectedIdioma = "";  // Store selected language

    // Event listener for each language button
    Object.keys(buttons).forEach(buttonId => {
        document.getElementById(buttonId).addEventListener('click', (event) => {
            selectedIdioma = buttons[buttonId];  // Store the selected language
            categoriaDiv.style.display = 'block';  // Show categories
            opcaoDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
            languageButtonsDiv.style.display = 'none'; // Hide language buttons

            // Remove active class from other buttons and add to the clicked one
            document.querySelectorAll('.language-buttons button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // Create category buttons dynamically based on available categories
            createCategoryButtons(Object.keys(mensagens));
        });
    });

    // Function to create category buttons
    function createCategoryButtons(categories) {
        categoriaContainer.innerHTML = ''; // Clear previous category buttons
        categories.forEach(categoria => {
            const categoryButton = document.createElement('button');
            categoryButton.textContent = categoria;
            categoryButton.classList.add('category-btn');
            categoriaContainer.appendChild(categoryButton);

            // Add event listener to each category button
            categoryButton.addEventListener('click', () => {
                opcaoDiv.style.display = 'block';
                categoriaDiv.style.display = 'none'; // Hide category buttons
                opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';

                // Add options for the selected category
                const opcoes = Object.keys(mensagens[categoria]);
                opcoes.forEach(opcao => {
                    const option = document.createElement('option');
                    option.value = opcao;
                    option.textContent = opcao;
                    opcaoSelect.appendChild(option);
                });

                // Show the Back button
                showBackButton();
            });
        });
    }

    // Function to show the Back button and allow returning to categories
    function showBackButton() {
        backButton.textContent = 'Voltar';  // Set the text of the button
        backButton.classList.add('back-btn');
        document.body.appendChild(backButton);  // Add it to the page

        backButton.addEventListener('click', () => {
            categoriaDiv.style.display = 'block';  // Show categories again
            opcaoDiv.style.display = 'none';  // Hide options
            mensagemSecao.style.display = 'none';  // Hide messages
            backButton.remove();  // Remove the Back button
        });
    }

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
