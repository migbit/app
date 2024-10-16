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
    const weekdayButtonsContainer = document.createElement('div');  // Container for weekday buttons
    const breadcrumbDiv = document.createElement('div');
    languageButtonsDiv.insertAdjacentElement('beforebegin', breadcrumbDiv);

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";
    let selectedDay = "";

    // Create weekday buttons
    const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    daysOfWeek.forEach(day => {
        const dayButton = document.createElement('button');
        dayButton.textContent = day;
        dayButton.classList.add('menu-btn');
        dayButton.addEventListener('click', () => {
            selectedDay = day;  // Store the selected day
            displayMessage(mensagens[selectedCategoria][selectedSubCategoria][selectedDay]);
        });
        weekdayButtonsContainer.appendChild(dayButton);
    });

    // Append weekday buttons container after the guest name input field
    guestNameContainer.insertAdjacentElement('afterend', weekdayButtonsContainer);

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
                // Show guest name input and day buttons only for "Quando Chegam?"
                if (selectedSubCategoria === 'Quando Chegam?') {
                    guestNameContainer.style.display = 'block';
                    weekdayButtonsContainer.style.display = 'block';  // Show the weekday buttons
                } else {
                    guestNameContainer.style.display = 'none';
                    weekdayButtonsContainer.style.display = 'none';
                }
            });
        });
        categoriaContainer.appendChild(ul);
    }

    // Function to display the selected message
    function displayMessage(messageObj) {
        const guestName = guestNameInput.value || '[Hospede]';  // Replace placeholder if needed
        const personalizedMessage = messageObj[selectedIdioma].replace('[Hospede]', guestName);
        mensagemContainer.innerHTML = `<p>${personalizedMessage}</p>`;
        categoriaContainer.style.display = 'none';  // Hide sub-categories
        mensagemSecao.style.display = 'block';  // Show the message section
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
