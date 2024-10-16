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
    const languageDropdown = document.getElementById('language-select');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaContainer = document.getElementById('categoria-container');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');
    const guestNameInput = document.getElementById('guest-name');
    const weekdayDropdown = document.getElementById('weekday-select');
    const breadcrumbDiv = document.createElement('div');
    categoriaDiv.insertAdjacentElement('beforebegin', breadcrumbDiv);

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    // Language selection logic
    languageDropdown.addEventListener('change', () => {
        selectedIdioma = languageDropdown.value;
        categoriaDiv.style.display = 'block'; // Show categories after language is selected
        createCategoryMenu(Object.keys(mensagens)); // Show categories for the selected language
    });

    // Function to create the category menu
    function createCategoryMenu(categories) {
        categoriaContainer.innerHTML = ''; // Clear previous categories

        const categoriaHeading = document.getElementById('categoria-heading');
        if (categoriaHeading) {
            categoriaHeading.style.display = 'block';
        }

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

    // Function to hide the category heading
    function hideCategoriaHeading() {
        const categoriaHeading = document.getElementById('categoria-heading');
        if (categoriaHeading) {
            categoriaHeading.style.display = 'none';
        }
    }

    // Function to show sub-categories as a menu
    function showSubCategoryMenu(subCategories) {
        categoriaContainer.innerHTML = ''; // Clear previous sub-categories

        // Special case for "Quando Chegam?"
        if (selectedCategoria === "Antes do Check-in" && subCategories["Quando Chegam?"]) {
            weekdayDropdown.style.display = 'block'; // Show the day of the week dropdown
            weekdayDropdown.addEventListener('change', () => {
                const selectedDay = weekdayDropdown.value;
                if (subCategories["Quando Chegam?"][selectedDay]) {
                    selectedSubCategoria = selectedDay;
                    updateBreadcrumb();
                    displayMessage(subCategories["Quando Chegam?"][selectedDay]);
                }
            });
            return;
        }

        hideCategoriaHeading(); // Hide the "Escolha a Categoria:" text
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
        const guestName = guestNameInput ? guestNameInput.value : "[Hospede]";
        let selectedMessage = messageObj[selectedIdioma];

        // Replace placeholders with actual values
        selectedMessage = selectedMessage.replace("[Hospede]", guestName);
        mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
        categoriaContainer.style.display = 'none'; // Hide sub-categories
        mensagemSecao.style.display = 'block'; // Show the message section
    }

    // Function to update breadcrumb navigation
    function updateBreadcrumb() {
        breadcrumbDiv.innerHTML = ''; // Clear previous breadcrumb
        const breadcrumb = [];

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

    // Function to reset to category selection
    function resetToCategorySelection() {
        selectedSubCategoria = "";  // Reset the selected sub-category
        mensagemSecao.style.display = 'none';  // Hide the message section
        categoriaContainer.style.display = 'block';  // Show the category container again
        categoriaDiv.style.display = 'block';  // Show the category div again

        showSubCategoryMenu(mensagens[selectedCategoria]);  // Recreate the sub-categories
        updateBreadcrumb();  // Update the breadcrumb to reflect the change
    }
}
