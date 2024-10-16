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
    const breadcrumbDiv = document.createElement('div'); // Create breadcrumb navigation
    languageButtonsDiv.insertAdjacentElement('beforebegin', breadcrumbDiv);

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    // Event listener for each language button
    document.querySelectorAll('.language-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            selectedIdioma = button.value;
            categoriaDiv.style.display = 'block';
            languageButtonsDiv.style.display = 'none'; // Hide language buttons
            mensagemSecao.style.display = 'none'; // Hide the message section

            updateBreadcrumb(); // Update breadcrumb
            createCategoryMenu(Object.keys(mensagens)); // Show categories for the selected language
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
                showSubCategoryMenu(mensagens[categoria]); // Show sub-categories for the selected category
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

    // Function to display the selected message
    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];
        mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
        categoriaContainer.style.display = 'none'; // Hide sub-categories
        mensagemSecao.style.display = 'block'; // Show the message section
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
        mensagemSecao.style.display = 'none'; // Hide the message section
        updateBreadcrumb();
    }

    // Function to reset to category selection
    function resetToCategorySelection() {
        selectedSubCategoria = "";
        mensagemSecao.style.display = 'none'; // Hide the message section
        showSubCategoryMenu(mensagens[selectedCategoria]); // Recreate the sub-categories for the current category
        updateBreadcrumb();
    }
}
