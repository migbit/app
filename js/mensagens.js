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
    const categoriaDropdown = document.getElementById('categoria-select');
    const subcategoriaDiv = document.getElementById('subcategoria-div');
    const subcategoriaDropdown = document.getElementById('subcategoria-select');
    const nameInputContainer = document.getElementById('name-input-container');
    const guestNameInput = document.getElementById('guest-name');
    const weekdayDropdownContainer = document.getElementById('weekday-dropdown-container');
    const weekdayDropdown = document.getElementById('weekday-select');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    // Updated logic for resetting all dropdowns
    function resetDropdowns() {
        categoriaDiv.style.display = 'none';
        subcategoriaDiv.style.display = 'none';
        nameInputContainer.style.display = 'none';
        weekdayDropdownContainer.style.display = 'none';
        mensagemSecao.style.display = 'none';
        categoriaDropdown.innerHTML = '<option value="">Selecionar Categoria</option>'; // Reset category dropdown
        subcategoriaDropdown.innerHTML = '<option value="">Selecionar Subcategoria</option>'; // Reset subcategory dropdown
    }

    // Populate `subcategoriaDropdown`
    function populateSubcategoriaDropdown(subCategories) {
        subcategoriaDropdown.innerHTML = '<option value="">Selecionar Subcategoria</option>'; // Reset options

        subCategories.forEach(subCategory => {
            const option = document.createElement('option');
            option.value = subCategory;
            option.textContent = subCategory;
            subcategoriaDropdown.appendChild(option);
        });

        subcategoriaDropdown.addEventListener('change', () => {
            selectedSubCategoria = subcategoriaDropdown.value;
            if (selectedSubCategoria) {
                handleSubcategoryChange(selectedSubCategoria);
            } else {
                mensagemSecao.style.display = 'none';
            }
        });
    }

    // Handle the subcategory logic
    function handleSubcategoryChange(subCategory) {
        if (subCategory === 'Quando Chegam?') {
            nameInputContainer.style.display = 'block';
            weekdayDropdownContainer.style.display = 'block';
    
            // Add event listener for when the weekday is selected
            weekdayDropdown.addEventListener('change', () => {
                const selectedWeekday = weekdayDropdown.value;
                if (selectedWeekday && mensagens[selectedCategoria][subCategory][selectedWeekday]) {
                    displayMessage(mensagens[selectedCategoria][subCategory][selectedWeekday]);
                } else {
                    mensagemSecao.style.display = 'none';
                }
            });
        } else {
            nameInputContainer.style.display = 'none';
            weekdayDropdownContainer.style.display = 'none';
            const subCategoryData = mensagens[selectedCategoria][subCategory];
            displayMessage(subCategoryData);
        }
    }
  

    // Display the selected message
    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];  // Fetch message based on selected language
        const guestName = guestNameInput.value.trim();  // Get guest name from input
    
        if (selectedMessage) {
            let finalMessage = selectedMessage;
    
            // Replace [Hospede] with the guest's name if available
            if (guestName && selectedMessage.includes('[Hospede]')) {
                finalMessage = selectedMessage.replace('[Hospede]', guestName);
            }
    
            mensagemContainer.innerHTML = `<p>${finalMessage}</p>`;
            mensagemSecao.style.display = 'block';
    
            // Copy to clipboard functionality
            mensagemContainer.addEventListener('click', () => {
                copyMessageToClipboard(finalMessage);
            });
        } else {
            mensagemContainer.innerHTML = 'Mensagem não disponível.';
        }
    }
    

    // Copy the message to the clipboard
    function copyMessageToClipboard(text) {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = text;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        alert('Mensagem copiada para a área de transferência');
    }

    // Populate `categoriaDropdown`
    function populateCategoriaDropdown(categories) {
        categoriaDropdown.innerHTML = '<option value="">Selecionar Categoria</option>'; // Reset options

        categories.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaDropdown.appendChild(option);
        });

        categoriaDropdown.addEventListener('change', () => {
            selectedCategoria = categoriaDropdown.value;
            if (selectedCategoria) {
                populateSubcategoriaDropdown(Object.keys(mensagens[selectedCategoria]));
                subcategoriaDiv.style.display = 'block'; // Show subcategory dropdown
            } else {
                subcategoriaDiv.style.display = 'none';
                mensagemSecao.style.display = 'none';
            }
        });
    }

    // Populate `languageDropdown`
    languageDropdown.addEventListener('change', () => {
        selectedIdioma = languageDropdown.value;
        if (selectedIdioma) {
            populateCategoriaDropdown(Object.keys(mensagens));
            categoriaDiv.style.display = 'block'; // Show category dropdown
        } else {
            resetDropdowns();
        }
    });
}
