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

            // Create category menu dynamically
            createCategoryMenu(Object.keys(mensagens));
        });
    });

    // Function to create the category menu
    function createCategoryMenu(categories) {
        categoriaContainer.innerHTML = ''; // Clear previous categories
        const ul = document.createElement('ul'); // Create a menu
        categories.forEach(categoria => {
            const li = document.createElement('li');
            li.textContent = categoria;
            ul.appendChild(li);

            // Event listener to display sub-categories
            li.addEventListener('click', () => {
                showSubCategoryMenu(mensagens[categoria], categoria);
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to show sub-categories as a menu
    function showSubCategoryMenu(subCategories, categoria) {
        categoriaContainer.innerHTML = ''; // Clear previous sub-categories
        const ul = document.createElement('ul');
        Object.keys(subCategories).forEach(subCategory => {
            const li = document.createElement('li');
            li.textContent = subCategory;
            ul.appendChild(li);

            // Event listener to display the message
            li.addEventListener('click', () => {
                displayMessage(subCategories[subCategory], categoria);
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to display the selected message
    function displayMessage(messageObj, categoria) {
        const selectedMessage = messageObj[selectedIdioma]; // Get the message in the selected language
        mensagemContainer.innerHTML = `<h3>${categoria}</h3><p>${selectedMessage}</p>`;
        mensagemSecao.style.display = 'block'; // Show the message section
    }
}
