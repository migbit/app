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

function initializeMessageSelectors(mensagens) {
    const languageButtonsDiv = document.querySelector('.language-buttons-vertical');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaContainer = document.getElementById('categoria-container');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');
    const languageDisplay = document.createElement('h3'); // To display the selected language
    languageButtonsDiv.insertAdjacentElement('beforebegin', languageDisplay);

    let selectedIdioma = "";  // Store selected language

    // Event listener for each language button
    document.querySelectorAll('.language-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            selectedIdioma = button.value;  // Store the selected language
            categoriaDiv.style.display = 'block';  // Show categories
            languageButtonsDiv.style.display = 'none'; // Hide language buttons
            
            // Display the selected language
            languageDisplay.textContent = `Idioma: ${selectedIdioma}`;

            // Create category buttons dynamically
            createCategoryButtons(Object.keys(mensagens));
        });
    });

    // Function to create category buttons
    function createCategoryButtons(categories) {
        categoriaContainer.innerHTML = ''; // Clear previous category buttons
        categories.forEach(categoria => {
            const categoryButton = document.createElement('button');
            categoryButton.textContent = categoria;
            categoryButton.classList.add('language-btn'); // Reusing the language button class for styling
            categoriaContainer.appendChild(categoryButton);

            // Add event listener to each category button
            categoryButton.addEventListener('click', () => {
                // Handle displaying options for the selected category
                showOptionsForCategory(mensagens[categoria]);
            });
        });
    }

    // Function to show options for a category
    function showOptionsForCategory(categoryOptions) {
        // Clear any previously displayed message
        mensagemContainer.innerHTML = '';

        // Display each option in the selected category
        Object.keys(categoryOptions).forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.textContent = option;
            optionButton.classList.add('language-btn');
            mensagemContainer.appendChild(optionButton);

            // Display the message for the selected option
            optionButton.addEventListener('click', () => {
                const selectedMessage = categoryOptions[option][selectedIdioma];
                mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
                mensagemSecao.style.display = 'block'; // Show the message section
            });
        });
    }
}
