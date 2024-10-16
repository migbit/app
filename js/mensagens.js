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
    const mensagemContainer = document.getElementById('mensagem-container');
    const breadcrumbDiv = document.createElement('div'); // Create breadcrumb navigation
    breadcrumbDiv.classList.add('breadcrumb');
    languageButtonsDiv.insertAdjacentElement('beforebegin', breadcrumbDiv);

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    // Event listener for each language button
    document.querySelectorAll('.language-btn').forEach(button => {
        button.addEventListener('click', () => {
            selectedIdioma = button.value;
            categoriaDiv.style.display = 'block';
            languageButtonsDiv.style.display = 'none'; // Hide language buttons
            mensagemContainer.innerHTML = ''; // Clear any previous message
            categoriaContainer.style.display = 'block'; // Show categories again

            updateBreadcrumb(); // Update breadcrumb
            createCategoryMenu(Object.keys(mensagens));
        });
    });

    // Function to create the category menu
    function createCategoryMenu(categories) {
        categoriaContainer.innerHTML = ''; // Clear previous categories
        const ul = document.createElement('ul');
        categories.forEach(categoria => {
            const li = document.createElement('li');
            li.textContent = categoria;
            ul.appendChild(li);

            // Event listener to display sub-categories
            li.addEventListener('click', () => {
                selectedCategoria = categoria;
                updateBreadcrumb();
                showSubCategoryMenu(mensagens[categoria]);
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to show sub-categories as a menu
    function showSubCategoryMenu(subCategories) {
        categoriaContainer.innerHTML = ''; // Clear previous sub-categories
        const ul = document.createElement('ul');
        Object.keys(subCategories).forEach(subCategory => {
            const li = document.createElement('li');
            li.textContent = subCategory;
            ul.appendChild(li);

            // Event listener to display the message
            li.addEventListener('click', () => {
                selectedSubCategoria = subCategory;
                updateBreadcrumb();
                displayMessage(subCategories[subCategory]);
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to display the selected message and handle copying
    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];
        mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
        categoriaContainer.style.display = 'none'; // Hide the category container
        mensagemContainer.style.display = 'block'; // Show the message

        // Set up the click event to copy the message
        mensagemContainer.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(mensagemContainer.innerText);
                alert('Mensagem Copiada');
            } catch (err) {
                console.error('Failed to copy message:', err);
            }
        });
    }

    // Function to update breadcrumb navigation
    function updateBreadcrumb() {
        breadcrumbDiv.innerHTML = ''; // Clear previous breadcrumb
        const breadcrumb = [];

        // Add language
        if (selectedIdioma) {
            const langCrumb = document.createElement('span');
            langCrumb.textContent = selectedIdioma;
            langCrumb.style.cursor = 'pointer';
            langCrumb.addEventListener('click', () => {
                resetToLanguageSelection();
            });
            breadcrumb.push(langCrumb);
        }

        // Add category
        if (selectedCategoria) {
            const categoryCrumb = document.createElement('span');
            categoryCrumb.textContent = ` > ${selectedCategoria}`;
            categoryCrumb.style.cursor = 'pointer';
            categoryCrumb.addEventListener('click', () => {
                resetToCategorySelection();
            });
            breadcrumb.push(categoryCrumb);
        }

        // Add sub-category
        if (selectedSubCategoria) {
            const subCategoryCrumb = document.createElement('span');
            subCategoryCrumb.textContent = ` > ${selectedSubCategoria}`;
            breadcrumb.push(subCategoryCrumb); // No need for clickable, this is the last step
        }

        // Append the breadcrumb elements
        breadcrumb.forEach(item => {
            breadcrumbDiv.appendChild(item);
        });
    }

    // Function to reset to language selection
    function resetToLanguageSelection() {
        selectedIdioma = "";
        selectedCategoria = "";
        selectedSubCategoria = "";
        categoriaDiv.style.display = 'none';
        languageButtonsDiv.style.display = 'block'; // Show language buttons
        mensagemContainer.style.display = 'none'; // Hide the message section
        updateBreadcrumb();
    }

    // Function to reset to category selection
    function resetToCategorySelection() {
        selectedCategoria = "";
        selectedSubCategoria = "";
        categoriaContainer.style.display = 'block'; // Show the categories
        mensagemContainer.style.display = 'none'; // Hide the message section
        updateBreadcrumb();
    }
}
