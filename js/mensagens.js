// Updated mensagens.js
import { mensagens } from './mensagensData.json';

// Load the JSON data
document.addEventListener('DOMContentLoaded', () => {
    const guestNameInput = document.getElementById('guestNameInput');
    const weekDayInput = document.getElementById('weekDayInput');

    if (guestNameInput && weekDayInput) {
        initializeMessageSelectors(mensagens);
    } else {
        console.error('Guest name or week day input fields are missing in the DOM.');
    }
});

// Function to initialize selectors and events
function initializeMessageSelectors(mensagens) {
    // Selecionar elementos do DOM
    const idiomaSelect = document.getElementById('idioma');
    const categoriaDiv = document.getElementById('categoria-div');
    const categoriaSelect = document.getElementById('categoria');
    const opcaoDiv = document.getElementById('opcao-div');
    const opcaoSelect = document.getElementById('opcao');
    const mensagemSecao = document.getElementById('mensagem-secao');
    const mensagemContainer = document.getElementById('mensagem-container');
    const inputsDiv = document.getElementById('inputs-div');

    // Evento para quando o idioma for selecionado
    idiomaSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        if (idioma) {
            categoriaDiv.style.display = 'block';
            opcaoDiv.style.display = 'none';
            inputsDiv.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';
            mensagemSecao.style.display = 'none';
        } else {
            categoriaDiv.style.display = 'none';
            opcaoDiv.style.display = 'none';
            inputsDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento para quando a categoria for selecionada
    categoriaSelect.addEventListener('change', () => {
        const categoria = categoriaSelect.value;
        if (categoria) {
            opcaoDiv.style.display = 'block';
            mensagemSecao.style.display = 'none';
            inputsDiv.style.display = 'none';
            opcaoSelect.innerHTML = '<option value="">Selecionar Opção</option>';

            const opcoes = Object.keys(mensagens[categoria]);
            opcoes.forEach(opcao => {
                const option = document.createElement('option');
                option.value = opcao;
                option.textContent = opcao;
                opcaoSelect.appendChild(option);
            });
        } else {
            opcaoDiv.style.display = 'none';
            inputsDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento para quando a opção for selecionada
    opcaoSelect.addEventListener('change', () => {
        const idioma = idiomaSelect.value;
        const categoria = categoriaSelect.value;
        const opcao = opcaoSelect.value;
        if (opcao) {
            inputsDiv.style.display = 'block';
            mensagemSecao.style.display = 'none';

            const mensagemTemplate = mensagens[categoria]?.[opcao]?.[idioma] || "Mensagem não encontrada para esta seleção.";
            let mensagemFinal = mensagemTemplate;

            // Substituir variáveis quando disponíveis
            guestNameInput.addEventListener('input', () => {
                mensagemFinal = replaceVariables(mensagemTemplate);
                mensagemContainer.innerHTML = mensagemFinal;
            });

            weekDayInput.addEventListener('input', () => {
                mensagemFinal = replaceVariables(mensagemTemplate);
                mensagemContainer.innerHTML = mensagemFinal;
            });

            mensagemContainer.innerHTML = mensagemFinal;
            mensagemSecao.style.display = 'block';
        } else {
            inputsDiv.style.display = 'none';
            mensagemSecao.style.display = 'none';
        }
    });

    // Evento do botão copiar
    const btnCopiar = document.getElementById('btn-copiar');
    btnCopiar.addEventListener('click', copiarMensagem);
}

// Função para copiar a mensagem para a área de transferência
function copiarMensagem() {
    const mensagem = document.getElementById('mensagem-container').textContent;
    navigator.clipboard.writeText(mensagem).then(() => {
        alert('Mensagem copiada para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar a mensagem: ', err);
    });
}

// Função para substituir as variáveis na mensagem
function replaceVariables(template) {
    const guestName = document.getElementById('guestNameInput').value;
    const weekDay = document.getElementById('weekDayInput').value;
    let message = template;
    message = message.replace('[Guest's Name]', guestName || '[Guest's Name]');
    message = message.replace('[Week Day]', weekDay || '[Week Day]');
    return message;
}