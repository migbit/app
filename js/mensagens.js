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
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');

    let selectedIdioma = "";
    let selectedCategoria = "";
    let selectedSubCategoria = "";

    // Event listener for language selection
    languageDropdown.addEventListener('change', () => {
        selectedIdioma = languageDropdown.value;

        if (selectedIdioma) {
            populateCategoriaDropdown(Object.keys(mensagens));
            categoriaDiv.style.display = 'block'; // Show the category dropdown
            subcategoriaDiv.style.display = 'none'; // Hide subcategory until category is selected
            mensagemSecao.style.display = 'none'; // Hide the message until a subcategory is selected
        } else {
            resetDropdowns();
        }
    });

    // Populate category dropdown
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

    // Populate subcategory dropdown
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
                displayMessage(mensagens[selectedCategoria][selectedSubCategoria]);
            } else {
                mensagemSecao.style.display = 'none';
            }
        });
    }

    // Function to display the selected message
    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];
        mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
        mensagemSecao.style.display = 'block'; // Show the message section
    }

    // Reset all dropdowns when needed
    function resetDropdowns() {
        categoriaDiv.style.display = 'none';
        subcategoriaDiv.style.display = 'none';
        mensagemSecao.style.display = 'none';
        categoriaDropdown.innerHTML = '<option value="">Selecionar Categoria</option>'; // Reset category dropdown
        subcategoriaDropdown.innerHTML = '<option value="">Selecionar Subcategoria</option>'; // Reset subcategory dropdown
    }
}
