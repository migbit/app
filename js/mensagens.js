// js/mensagens.js

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

// Function to initialize selectors and events
function initializeMessageSelectors(mensagens) {
    const idiomaSelect = document.getElementById('idioma');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaSelect = document.getElementById('categoria');
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const guestNameInput = document.getElementById('guest-name');
    const weekTypeSelect = document.getElementById('week-type');
    const weekDaySelect = document.getElementById('week-day');
    const modifiersDiv = document.getElementById('modifiers');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');

    idiomaSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            categoriaDiv.style.display = 'block';
        } else {
            categoriaDiv.style.display = 'none';
        }
        resetSelections();
    });

    categoriaSelect.addEventListener('change', () => {
        const categoria = categoriaSelect.value;
        if (categoria) {
            opcaoDiv.style.display = 'block';
            const opcoes = Object.keys(mensagens[categoria]);
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
            opcoes.forEach(opcao => {
                const option = document.createElement('option');
                option.value = opcao;
                option.textContent = opcao;
                opcaoSelect.appendChild(option);
            });
        } else {
            resetSelections();
        }
    });

    opcaoSelect.addEventListener('change', () => {
        const opcao = opcaoSelect.value;
        if (opcao === 'Quando Chegam?') {
            guestNameInput.style.display = 'block';
            weekTypeSelect.style.display = 'block';
            weekDaySelect.style.display = 'block';
            modifiersDiv.style.display = 'block';
        } else {
            guestNameInput.style.display = 'none';
            weekTypeSelect.style.display = 'none';
            weekDaySelect.style.display = 'none';
            modifiersDiv.style.display = 'none';
        }
        mensagemSecao.style.display = 'none';
    });

    document.getElementById('btn-sms').addEventListener('click', () => {
        appendToMessage('I’m Miguel, your Porto Airbnb host.');
    });

    document.getElementById('btn-baby').addEventListener('click', () => {
        appendToMessage('Additionally, I’d like to know if you need a baby bed and/or a feeding chair.');
    });

    mensagemContainer.addEventListener('click', copiarMensagem);

    function appendToMessage(text) {
        const mensagem = mensagemContainer.innerHTML;
        mensagemContainer.innerHTML = mensagem.replace('</p>', ` ${text}</p>`);
    }

    function resetSelections() {
        opcaoDiv.style.display = 'none';
        guestNameInput.style.display = 'none';
        weekTypeSelect.style.display = 'none';
        weekDaySelect.style.display = 'none';
        modifiersDiv.style.display = 'none';
        mensagemSecao.style.display = 'none';
    }

    function copiarMensagem() {
        const mensagem = mensagemContainer.innerText;
        navigator.clipboard.writeText(mensagem).then(() => {
            alert('Mensagem copiada para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar a mensagem: ', err);
        });
    }
}
