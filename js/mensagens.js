// Load the JSON data
document.addEventListener('DOMContentLoaded', () => {
    fetch('./mensagensData.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(initializeMessageSelectors)
        .catch(error => {
            console.error('Error fetching the JSON data:', error);
        });
});

function initializeMessageSelectors(mensagens) {
    const elements = {
        languageDropdown: document.getElementById('language-select'),
        categoriaDiv: document.getElementById('categoria-div'),
        categoriaDropdown: document.getElementById('categoria-select'),
        subcategoriaDiv: document.getElementById('subcategoria-div'),
        subcategoriaDropdown: document.getElementById('subcategoria-select'),
        nameInputContainer: document.getElementById('name-input-container'),
        guestNameInput: document.getElementById('guest-name'),
        weekdayDropdownContainer: document.getElementById('weekday-dropdown-container'),
        weekdayDropdown: document.getElementById('weekday-select'),
        mensagemSecao: document.getElementById('mensagem-secao'),
        mensagemContainer: document.getElementById('mensagem-container')
    };

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    function resetDropdowns() {
        [elements.categoriaDiv, elements.subcategoriaDiv, elements.nameInputContainer, 
         elements.weekdayDropdownContainer, elements.mensagemSecao].forEach(el => el.style.display = 'none');
        elements.categoriaDropdown.innerHTML = '<option value="">Selecionar Categoria</option>';
        elements.subcategoriaDropdown.innerHTML = '<option value="">Selecionar Subcategoria</option>';
    }

    function populateDropdown(dropdown, options, defaultText) {
        dropdown.innerHTML = `<option value="">${defaultText}</option>`;
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            dropdown.appendChild(optionElement);
        });
    }

    function handleSubcategoryChange(subCategory) {
        const isWhenArrive = subCategory === 'Quando Chegam?';
        elements.nameInputContainer.style.display = isWhenArrive ? 'block' : 'none';
        elements.weekdayDropdownContainer.style.display = isWhenArrive ? 'block' : 'none';

        if (isWhenArrive) {
            elements.weekdayDropdown.onchange = () => {
                const selectedWeekday = elements.weekdayDropdown.value;
                if (selectedWeekday && mensagens[selectedCategoria][subCategory][selectedWeekday]) {
                    displayMessage(mensagens[selectedCategoria][subCategory][selectedWeekday]);
                } else {
                    elements.mensagemSecao.style.display = 'none';
                }
            };
        } else {
            displayMessage(mensagens[selectedCategoria][subCategory]);
        }
    }

    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];
        const guestName = elements.guestNameInput.value.trim();

        if (selectedMessage) {
            const finalMessage = guestName ? selectedMessage.replace(/\[Hospede\]/g, guestName) : selectedMessage;
            elements.mensagemContainer.innerHTML = `<p>${finalMessage}</p>`;
            elements.mensagemSecao.style.display = 'block';
            elements.mensagemContainer.onclick = () => copyMessageToClipboard(finalMessage);
        } else {
            elements.mensagemContainer.innerHTML = 'Mensagem não disponível.';
        }
    }

    function copyMessageToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Mensagem copiada para a área de transferência'))
            .catch(err => console.error('Failed to copy: ', err));
    }

    elements.languageDropdown.onchange = () => {
        selectedIdioma = elements.languageDropdown.value;
        if (selectedIdioma) {
            populateDropdown(elements.categoriaDropdown, Object.keys(mensagens), 'Selecionar Categoria');
            elements.categoriaDiv.style.display = 'block';
        } else {
            resetDropdowns();
        }
    };

    elements.categoriaDropdown.onchange = () => {
        selectedCategoria = elements.categoriaDropdown.value;
        if (selectedCategoria) {
            populateDropdown(elements.subcategoriaDropdown, Object.keys(mensagens[selectedCategoria]), 'Selecionar Subcategoria');
            elements.subcategoriaDiv.style.display = 'block';
        } else {
            elements.subcategoriaDiv.style.display = 'none';
            elements.mensagemSecao.style.display = 'none';
        }
    };

    elements.subcategoriaDropdown.onchange = () => {
        selectedSubCategoria = elements.subcategoriaDropdown.value;
        if (selectedSubCategoria) {
            handleSubcategoryChange(selectedSubCategoria);
        } else {
            elements.mensagemSecao.style.display = 'none';
        }
    };
}