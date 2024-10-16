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

// Main function to initialize dropdowns and message display logic
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

    // Reset all dropdowns and hide elements when needed
    function resetDropdowns() {
        categoriaDiv.style.display = 'none'; // Hide category dropdown
        subcategoriaDiv.style.display = 'none'; // Hide subcategory dropdown
        mensagemSecao.style.display = 'none'; // Hide message section
        categoriaDropdown.innerHTML = '<option value="">Selecionar Categoria</option>'; // Clear category options
        subcategoriaDropdown.innerHTML = '<option value="">Selecionar Subcategoria</option>'; // Clear subcategory options
    }

    // Function to populate the category dropdown based on selected language
    function populateCategoriaDropdown(categories) {
        categoriaDropdown.innerHTML = '<option value="">Selecionar Categoria</option>'; // Reset options

        categories.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaDropdown.appendChild(option);
        });

        categoriaDiv.style.display = 'block'; // Show category dropdown
    }

    // Function to populate the subcategory dropdown based on selected category
    function populateSubcategoriaDropdown(subCategories) {
        subcategoriaDropdown.innerHTML = '<option value="">Selecionar Subcategoria</option>'; // Reset options

        subCategories.forEach(subCategory => {
            const option = document.createElement('option');
            option.value = subCategory;
            option.textContent = subCategory;
            subcategoriaDropdown.appendChild(option);
        });

        subcategoriaDiv.style.display = 'block'; // Show subcategory dropdown
    }

    // Function to display the selected message
    function displayMessage(messageObj) {
        const selectedMessage = messageObj[selectedIdioma];
        mensagemContainer.innerHTML = `<p>${selectedMessage}</p>`;
        mensagemSecao.style.display = 'block'; // Show the message section
    }

    // Event listener for language selection
    languageDropdown.addEventListener('change', () => {
        selectedIdioma = languageDropdown.value;
        if (selectedIdioma) {
            resetDropdowns(); // Reset all dropdowns and hide unnecessary elements
            populateCategoriaDropdown(Object.keys(mensagens)); // Populate categories for selected language
        } else {
            resetDropdowns(); // Reset everything if no language is selected
        }
    });

    // Event listener for category selection
    categoriaDropdown.addEventListener('change', () => {
        selectedCategoria = categoriaDropdown.value;
        if (selectedCategoria) {
            subcategoriaDiv.style.display = 'none'; // Hide subcategory dropdown initially
            mensagemSecao.style.display = 'none'; // Hide message section initially
            populateSubcategoriaDropdown(Object.keys(mensagens[selectedCategoria])); // Populate subcategories for selected category
        } else {
            subcategoriaDiv.style.display = 'none'; // Reset if no category is selected
            mensagemSecao.style.display = 'none'; // Reset if no category is selected
        }
    });

    // Event listener for subcategory selection
    subcategoriaDropdown.addEventListener('change', () => {
        selectedSubCategoria = subcategoriaDropdown.value;
        if (selectedSubCategoria) {
            displayMessage(mensagens[selectedCategoria][selectedSubCategoria]); // Show message for selected subcategory
        } else {
            mensagemSecao.style.display = 'none'; // Reset if no subcategory is selected
        }
    });
}
