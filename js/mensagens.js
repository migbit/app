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
    const guestNameContainer = document.getElementById('guest-name-container');
    const guestNameInput = document.getElementById('guest-name');
    const breadcrumbDiv = document.createElement('div');
    languageButtonsDiv.insertAdjacentElement('beforebegin', breadcrumbDiv);

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    // Event listener for each language button
    document.querySelectorAll('.language-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            selectedIdioma = button.value;
            categoriaDiv.style.display = 'block';
            languageButtonsDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';

            updateBreadcrumb();
            createCategoryMenu(Object.keys(mensagens));
        });
    });

    // Function to create the category menu
    function createCategoryMenu(categories) {
        categoriaContainer.innerHTML = '';
        const ul = document.createElement('ul');
        categories.forEach(categoria => {
            const li = document.createElement('li');
            li.textContent = categoria;
            ul.appendChild(li);

            li.addEventListener('click', () => {
                selectedCategoria = categoria;
                updateBreadcrumb();
                showSubCategoryMenu(mensagens[categoria]);
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to show sub-categories
    function showSubCategoryMenu(subCategories) {
        categoriaContainer.innerHTML = '';
        const ul = document.createElement('ul');
        Object.keys(subCategories).forEach(subCategory => {
            const li = document.createElement('li');
            li.textContent = subCategory;
            ul.appendChild(li);

            li.addEventListener('click', () => {
                selectedSubCategoria = subCategory;
                updateBreadcrumb();
                displayMessage(subCategories[subCategory]);
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to display the selected message and replace [Hospede] placeholder
    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];

        if (selectedSubCategoria === 'Quando Chegam?') {
            // Show guest name input field
            guestNameContainer.style.display = 'block';

            // Event listener to replace [Hospede] with input value
            guestNameInput.addEventListener('input', () => {
                const guestName = guestNameInput.value;
                const personalizedMessage = selectedMessage.replace('[Hospede]', guestName || '[Hospede]');
                mensagemContainer.innerHTML = `<p>${personalizedMessage}</p>`;
            });

        } else {
            // Hide guest name input field if it's not "Quando Chegam?"
            guestNameContainer.style.display = 'none';
            mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
        }

        categoriaContainer.style.display = 'none';
        mensagemSecao.style.display = 'block';
    }

    // Function to update breadcrumb navigation
    function updateBreadcrumb() {
        breadcrumbDiv.innerHTML = '';
        const breadcrumb = [];

        if (selectedIdioma) {
            const langCrumb = document.createElement('span');
            langCrumb.textContent = selectedIdioma;
            langCrumb.style.cursor = 'pointer';
            langCrumb.addEventListener('click', resetToLanguageSelection);
            breadcrumb.push(langCrumb);
        }

        if (selectedCategoria) {
            const categoryCrumb = document.createElement('span');
            categoryCrumb.textContent = ` > ${selectedCategoria}`;
            categoryCrumb.style.cursor = 'pointer';
            categoryCrumb.addEventListener('click', resetToCategorySelection);
            breadcrumb.push(categoryCrumb);
        }

        if (selectedSubCategoria) {
            const subCategoryCrumb = document.createElement('span');
            subCategoryCrumb.textContent = ` > ${selectedSubCategoria}`;
            breadcrumb.push(subCategoryCrumb);
        }

        breadcrumb.forEach(item => breadcrumbDiv.appendChild(item));
    }

    // Function to reset to language selection
    function resetToLanguageSelection() {
        selectedIdioma = "";
        selectedCategoria = "";
        selectedSubCategoria = "";
        categoriaDiv.style.display = 'none';
        languageButtonsDiv.style.display = 'block';
        mensagemSecao.style.display = 'none';
        updateBreadcrumb();
    }

    // Function to reset to category selection
    function resetToCategorySelection() {
        selectedSubCategoria = "";
        mensagemSecao.style.display = 'none';
        categoriaContainer.style.display = 'block';
        categoriaDiv.style.display = 'block';
        showSubCategoryMenu(mensagens[selectedCategoria]);
        updateBreadcrumb();
    }
}
